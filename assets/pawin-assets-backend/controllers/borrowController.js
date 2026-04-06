const asyncHandler = require('../middleware/asyncHandler.js');
const connectToDatabase = require('../config/db.js');
const jwt = require('jsonwebtoken');
const { getIO } = require('../socket');
const path = require('path');

// ========================================================
// 🚀 ฟังก์ชันคำนวณวันสิ้นเดือน (หลบเสาร์-อาทิตย์ ให้เป็นวันศุกร์)
const getWorkingEndOfMonth = (monthsToAdd = 1) => {
  let date = new Date();

  // เลื่อนไปเดือนถัดไป แล้วตั้งวันที่เป็น 0 (จะได้วันสุดท้ายของเดือนที่ต้องการเป๊ะๆ)
  date.setMonth(date.getMonth() + monthsToAdd + 1);
  date.setDate(0);

  // เช็ควันในสัปดาห์ (0 = อาทิตย์, 1 = จันทร์, ..., 6 = เสาร์)
  const dayOfWeek = date.getDay();

  if (dayOfWeek === 6) {
    // ถ้าวันสุดท้ายเป็น "วันเสาร์" ให้ถอยกลับ 1 วัน (เป็นวันศุกร์)
    date.setDate(date.getDate() - 1);
  } else if (dayOfWeek === 0) {
    // ถ้าวันสุดท้ายเป็น "วันอาทิตย์" ให้ถอยกลับ 2 วัน (เป็นวันศุกร์)
    date.setDate(date.getDate() - 2);
  }

  // ล็อคเวลาเป็น 23:59:59 น. ของวันนั้น
  date.setHours(23, 59, 59, 999);
  return date;
};
// ========================================================

/**
 * ฟังก์ชันช่วยปิดการเชื่อมต่อแบบ Pool Friendly
 */
const closeConn = async (conn) => {
  if (!conn) return;
  try {
    if (typeof conn.release === 'function') {
      await conn.release();
    } else if (typeof conn.end === 'function') {
      await conn.end();
    }
  } catch (err) {
    console.error("❌ Error closing connection:", err.message);
  }
};

// -----------------------------------------------------------------------------------
// 1. ฟังก์ชันขอเบิกของ (ระงับสิทธิ์หากเครดิตติดลบ)
const createBorrowRecord = asyncHandler(async (req, res) => {
  const { cartItems } = req.body;
  let token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401); throw new Error('กรุณาล็อกอินก่อนทำรายการ'); }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const connection = await connectToDatabase();

  try {
    // ตรวจสอบค่าปรับผู้ใช้งานก่อน (ถ้าติดหนี้ ห้ามยืม)
    const [userCheck] = await connection.query('SELECT penalty FROM users WHERE _id = ?', [decoded.id]);
    const currentPenalty = userCheck[0]?.penalty || 0;

    if (currentPenalty > 0) {
      res.status(403);
      throw new Error(`ไม่สามารถทำรายการได้เนื่องจากคุณมียอดค่าปรับค้างชำระ (฿${Math.abs(currentPenalty).toLocaleString()}) กรุณาชำระค่าปรับก่อนใช้งาน`);
    }

    await connection.beginTransaction();

    for (let item of cartItems) {
      // 🚀 ดึง is_longterm พ่วงมาเช็คด้วย
      const [stockCheck] = await connection.query('SELECT quantity, is_longterm FROM tbl_product WHERE ID = ?', [item.ID]);

      // 🛡️ Validate borrowQty > 0
      const qty = Number(item.borrowQty);
      if (!qty || qty <= 0 || !Number.isInteger(qty)) {
        throw new Error(`จำนวนเบิกต้องเป็นจำนวนเต็มบวก (สินค้า ${item.electotronixPN || item.ID})`);
      }

      if (stockCheck.length === 0 || stockCheck[0].quantity < qty) {
        throw new Error(`สินค้ารหัส ${item.electotronixPN} มีสต๊อกไม่เพียงพอ`);
      }

      // 🚀 กำหนด Due Date
      let dueDate;
      if (stockCheck[0].is_longterm) {
        // ของระยะยาว: ให้ดิวเป็น "วันศุกร์สิ้นเดือนถัดไป" อัตโนมัติ (ใส่ 1 คือนับไป 1 เดือน)
        dueDate = getWorkingEndOfMonth(1);
      } else {
        // ของชั่วคราว: นับ 30 วันตามปกติ
        dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
      }

      await connection.query(
        'INSERT INTO tbl_borrow (user_id, product_id, quantity, status, borrow_date, due_date) VALUES (?, ?, ?, ?, NOW(), ?)',
        [decoded.id, item.ID, qty, 'pending_approval', dueDate]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'ส่งคำขอเบิกอุปกรณ์แล้ว รอการอนุมัติจาก Admin' });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(400); throw new Error(error.message);
  } finally {
    await closeConn(connection);
  }
});


// -----------------------------------------------------------------------------------
// 🚀 1.1 Admin อนุมัติการเบิกของ (หักสต๊อก และเปลี่ยนเป็น active)
const approveBorrow = asyncHandler(async (req, res) => {
  const borrowId = req.params.id;
  const connection = await connectToDatabase();

  try {
    await connection.beginTransaction();

    const [borrows] = await connection.query(`
      SELECT b.*, p.electotronixPN, p.quantity as currentStock 
      FROM tbl_borrow b 
      JOIN tbl_product p ON b.product_id = p.ID 
      WHERE b.id = ?`, [borrowId]);
    const borrowRecord = borrows[0];

    if (!borrowRecord || borrowRecord.status !== 'pending_approval') {
      res.status(400); throw new Error('รายการนี้ไม่อยู่ในสถานะรออนุมัติเบิก');
    }

    if (borrowRecord.currentStock < borrowRecord.quantity) {
      res.status(400); throw new Error(`สต๊อก ${borrowRecord.electotronixPN} ไม่เพียงพอสำหรับการจ่ายของ`);
    }

    await connection.query(`UPDATE tbl_product SET quantity = quantity - ? WHERE ID = ?`, [borrowRecord.quantity, borrowRecord.product_id]);
    await connection.query(`UPDATE tbl_borrow SET status = 'active' WHERE id = ?`, [borrowId]);

    const approveTitle = 'อนุมัติการเบิกสำเร็จ ✅';
    const approveMsg = `Admin อนุมัติให้คุณเบิก ${borrowRecord.electotronixPN} จำนวน ${borrowRecord.quantity} ชิ้น เรียบร้อยแล้ว`;
    await connection.query(
      `INSERT INTO tbl_notifications (user_id, title, message) VALUES (?, ?, ?)`,
      [borrowRecord.user_id, approveTitle, approveMsg]
    );
    try { getIO().to(`user_${borrowRecord.user_id}`).emit('new_notification', { title: approveTitle, message: approveMsg }); } catch (e) { }

    await connection.commit();
    res.json({ message: 'อนุมัติการเบิกอุปกรณ์เรียบร้อยแล้ว' });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500); throw new Error('เกิดข้อผิดพลาดในการอนุมัติเบิก: ' + error.message);
  } finally {
    await closeConn(connection);
  }
});

// -----------------------------------------------------------------------------------
// 🚀 1.2 Admin ปฏิเสธการเบิกของ
const rejectBorrow = asyncHandler(async (req, res) => {
  const borrowId = req.params.id;
  const connection = await connectToDatabase();

  try {
    const [borrows] = await connection.query(`
      SELECT b.*, p.electotronixPN 
      FROM tbl_borrow b 
      JOIN tbl_product p ON b.product_id = p.ID 
      WHERE b.id = ?`, [borrowId]);
    const borrowRecord = borrows[0];

    if (!borrowRecord || borrowRecord.status !== 'pending_approval') {
      res.status(400); throw new Error('รายการนี้ไม่อยู่ในสถานะรออนุมัติเบิก');
    }

    await connection.beginTransaction();
    await connection.query(`DELETE FROM tbl_borrow WHERE id = ?`, [borrowId]);

    const rejectTitle = 'คำขอเบิกถูกปฏิเสธ ❌';
    const rejectMsg = `Admin ไม่อนุมัติการเบิก ${borrowRecord.electotronixPN} ของคุณ`;
    await connection.query(
      `INSERT INTO tbl_notifications (user_id, title, message) VALUES (?, ?, ?)`,
      [borrowRecord.user_id, rejectTitle, rejectMsg]
    );
    try { getIO().to(`user_${borrowRecord.user_id}`).emit('new_notification', { title: rejectTitle, message: rejectMsg }); } catch (e) { }

    await connection.commit();
    res.json({ message: 'ปฏิเสธคำขอเบิกอุปกรณ์เรียบร้อยแล้ว' });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500); throw new Error(error.message);
  } finally {
    await closeConn(connection);
  }
});

// -----------------------------------------------------------------------------------
// 🚀 1.3 ดึงรายการรออนุมัติเบิก (สำหรับ Admin)
const getAllPendingBorrows = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  try {
    const [pendingList] = await connection.query(`
      SELECT b.*, p.electotronixPN, p.img, u.name AS userName 
      FROM tbl_borrow b
      JOIN tbl_product p ON b.product_id = p.ID
      JOIN users u ON b.user_id = u._id 
      WHERE b.status = 'pending_approval'
      ORDER BY b.borrow_date ASC
    `);
    res.json(pendingList);
  } catch (error) {
    res.status(500); throw new Error(error.message);
  } finally {
    await closeConn(connection);
  }
});

// -----------------------------------------------------------------------------------
// 🚀 2. ดึงรายการรอตรวจสอบคืนของ (สำหรับ Admin)
const getAllPendingReturns = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  try {
    // 🚀 ดึง is_longterm และ asset_condition แนบไปให้ Frontend หน้า AdminApprovals ด้วย
    const [pendingList] = await connection.query(`
      SELECT b.*, p.electotronixPN, p.price AS productPrice, p.is_longterm, u.name AS userName, u.penalty AS userCredit
      FROM tbl_borrow b
      JOIN tbl_product p ON b.product_id = p.ID
      JOIN users u ON b.user_id = u._id 
      WHERE b.status = 'pending_return'
      ORDER BY b.return_date ASC
    `);
    res.json(pendingList);
  } finally {
    await closeConn(connection);
  }
});

// -----------------------------------------------------------------------------------
// 🚀 3. User ส่งคืนของ หรือ ถ่ายรูปเช็คสถานะ
const requestReturn = asyncHandler(async (req, res) => {
  const borrowId = req.params.id;

  // ตรวจสอบ token
  let token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401); throw new Error('กรุณาล็อกอินก่อนทำรายการ'); }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 🚀 รับค่าจาก FormData (Frontend ส่งมาเป็น string)
  const isCheckIn = req.body.is_checkin === 'true' ? 1 : 0;
  const assetCondition = req.body.asset_condition || null;

  // 🚀 ถ้าของหาย (lost) ไม่จำเป็นต้องแนบรูป — เพราะของไม่มีแล้ว
  if (!req.file && assetCondition !== 'lost') {
    res.status(400); throw new Error('กรุณาแนบรูปภาพหลักฐาน');
  }

  const imgUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const connection = await connectToDatabase();

  try {
    // ดึงข้อมูลการยืม + ราคาสินค้า สำหรับคำนวณค่าปรับ
    const [borrows] = await connection.query(
      `SELECT b.*, p.price AS productPrice 
       FROM tbl_borrow b 
       JOIN tbl_product p ON b.product_id = p.ID 
       WHERE b.id = ?`, [borrowId]
    );
    const borrowRecord = borrows[0];
    if (!borrowRecord) { res.status(404); throw new Error('ไม่พบข้อมูลการยืม'); }

    // === คำนวณค่าปรับ ===
    let overduePenalty = 0;
    let conditionPenalty = 0;
    const now = new Date();
    const dueDate = new Date(borrowRecord.due_date);
    const unitPrice = Number(borrowRecord.productPrice) || 0;

    // 1) ค่าปรับเลยกำหนด (ไม่คิดตอนเช็คอินระยะยาว)
    if (!isCheckIn && now > dueDate) {
      const diffDays = Math.ceil(Math.abs(now - dueDate) / (1000 * 60 * 60 * 24));
      overduePenalty = diffDays * 50;
    }

    // 2) ค่าปรับตามสภาพอุปกรณ์ (damaged = 50%, lost = 100%)
    if (assetCondition === 'damaged') {
      conditionPenalty = Math.round(unitPrice * borrowRecord.quantity * 0.5);
    } else if (assetCondition === 'lost') {
      conditionPenalty = Math.round(unitPrice * borrowRecord.quantity * 1.0);
    }

    const totalPenalty = overduePenalty + conditionPenalty;

    // 🚀 บันทึกสถานะ, รูปล่าสุด, การเช็คอิน, สภาพอุปกรณ์, ค่าปรับรวม
    await connection.query(
      `UPDATE tbl_borrow 
       SET status = 'pending_return', 
           return_image = ?, 
           penalty_fee = ?, 
           return_date = NOW(),
           is_checkin = ?, 
           asset_condition = ?
       WHERE id = ?`,
      [imgUrl, totalPenalty, isCheckIn, assetCondition, borrowId]
    );
    res.json({
      message: 'ส่งหลักฐานเรียบร้อย รอแอดมินตรวจสอบ',
      penalty: totalPenalty,
      breakdown: {
        overdue: overduePenalty,
        condition: conditionPenalty
      }
    });
  } finally {
    await closeConn(connection);
  }
});

// -----------------------------------------------------------------------------------
// 🚀 Helper: สร้างตาราง tbl_transactions อัตโนมัติ (ถ้ายังไม่มี)
const ensureTransactionTable = async (conn) => {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS tbl_transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      borrow_id INT,
      type ENUM('overdue_penalty','damage_fee','lost_fee','credit_adjustment','force_return') NOT NULL,
      amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_type (type),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

// -----------------------------------------------------------------------------------
// 🚀 4. Admin อนุมัติคืนของ หรือ อนุมัติรายงานสถานะ
const approveReturn = asyncHandler(async (req, res) => {
  const borrowId = req.params.id;
  const connection = await connectToDatabase();

  try {
    const [borrows] = await connection.query(`
      SELECT b.*, p.electotronixPN, p.is_longterm, p.price AS productPrice
      FROM tbl_borrow b 
      JOIN tbl_product p ON b.product_id = p.ID WHERE b.id = ?`, [borrowId]);
    const borrowRecord = borrows[0];

    if (!borrowRecord || borrowRecord.status !== 'pending_return') {
      res.status(400); throw new Error('รายการนี้ไม่อยู่ในสถานะรอตรวจสอบ');
    }

    await connection.beginTransaction();

    // 🚀 สร้างตาราง transaction อัตโนมัติ (ถ้ายังไม่มี)
    await ensureTransactionTable(connection);

    // 🚀 แยกทางเดิน: ของระยะยาว vs ของชั่วคราว
    if (borrowRecord.is_longterm || borrowRecord.is_checkin) {

      // === ของระยะยาว: เช็คสภาพอุปกรณ์ก่อน ===
      const condition = borrowRecord.asset_condition;

      if (condition === 'damaged' || condition === 'lost') {
        // ของระยะยาวที่เสียหาย/สูญหาย → หักเงิน + จบการยืม
        const totalDeduction = borrowRecord.penalty_fee || 0;

        if (totalDeduction > 0) {
          await connection.query(`UPDATE users SET penalty = penalty + ? WHERE _id = ?`, [totalDeduction, borrowRecord.user_id]);

          // บันทึก Transaction Log
          const txType = condition === 'lost' ? 'lost_fee' : 'damage_fee';
          const txDesc = condition === 'lost'
            ? `อุปกรณ์ ${borrowRecord.electotronixPN} สูญหาย (x${borrowRecord.quantity}) | หักเต็มจำนวน ฿${totalDeduction.toLocaleString()}`
            : `อุปกรณ์ ${borrowRecord.electotronixPN} ชำรุด (x${borrowRecord.quantity}) | หัก 50% = ฿${totalDeduction.toLocaleString()}`;

          await connection.query(
            `INSERT INTO tbl_transactions (user_id, borrow_id, type, amount, description) VALUES (?, ?, ?, ?, ?)`,
            [borrowRecord.user_id, borrowId, txType, totalDeduction, txDesc]
          );
        }

        // ถ้าของเสียหาย → คืนสต๊อกกลับ (แต่อาจต้องซ่อม)
        // ถ้าของหาย → ไม่คืนสต๊อก
        if (condition === 'damaged') {
          await connection.query(`UPDATE tbl_product SET quantity = quantity + ? WHERE ID = ?`, [borrowRecord.quantity, borrowRecord.product_id]);
        }
        // lost → ไม่บวกสต๊อกกลับ (ของหายแล้ว)

        await connection.query(`UPDATE tbl_borrow SET status = 'returned' WHERE id = ?`, [borrowId]);

        const condTitle = condition === 'lost' ? 'แจ้งของสูญหาย — ยืนยันแล้ว ⚠️' : 'แจ้งของชำรุด — ยืนยันแล้ว ⚠️';
        const condMsg = `Admin ตรวจสอบ ${borrowRecord.electotronixPN} แล้ว${totalDeduction > 0 ? ` | โดนหักเครดิต ฿${totalDeduction.toLocaleString()}` : ''}`;
        await connection.query(
          `INSERT INTO tbl_notifications (user_id, title, message) VALUES (?, ?, ?)`,
          [borrowRecord.user_id, condTitle, condMsg]
        );
        try { getIO().to(`user_${borrowRecord.user_id}`).emit('new_notification', { title: condTitle, message: condMsg }); } catch (e) { }

      } else {
        // 🔵 ของระยะยาว สภาพดี: เปลี่ยนอันเก่าเป็นคืนแล้ว และสร้างรายการยืมใหม่อัตโนมัติ (ต่ออายุ)
        const newDueDate = getWorkingEndOfMonth(1);
        const autoRenewDate = new Date();

        // 1. ปิดจ๊อบรายการเก่า
        await connection.query(`
          UPDATE tbl_borrow 
          SET status = 'returned',
              return_date = NOW()
          WHERE id = ?`, [borrowId]);

        // 2. สร้างรายการยืมรอบใหม่ให้ทันที
        await connection.query(`
          INSERT INTO tbl_borrow 
          (user_id, product_id, quantity, status, borrow_date, due_date) 
          VALUES (?, ?, ?, 'active', ?, ?)`,
          [borrowRecord.user_id, borrowRecord.product_id, borrowRecord.quantity, autoRenewDate, newDueDate]
        );

        const checkinTitle = 'ต่ออายุอุปกรณ์สำเร็จ ✅';
        const checkinMsg = `Admin ตรวจสอบ ${borrowRecord.electotronixPN} แล้ว และได้ทำการต่ออายุรอบบิลถัดไปให้เรียบร้อย`;
        await connection.query(
          `INSERT INTO tbl_notifications (user_id, title, message) VALUES (?, ?, ?)`,
          [borrowRecord.user_id, checkinTitle, checkinMsg]
        );
        try { getIO().to(`user_${borrowRecord.user_id}`).emit('new_notification', { title: checkinTitle, message: checkinMsg }); } catch (e) { }
      }

    } else {

      // 🟠 ของชั่วคราว: คืนตามปกติ
      await connection.query(`UPDATE tbl_borrow SET status = 'returned' WHERE id = ?`, [borrowId]);

      // ถ้าของหาย ไม่คืนสต๊อก / ถ้าเสียหายหรือปกติ คืนสต๊อก
      if (borrowRecord.asset_condition !== 'lost') {
        await connection.query(`UPDATE tbl_product SET quantity = quantity + ? WHERE ID = ?`, [borrowRecord.quantity, borrowRecord.product_id]);
      }

      // หักเงิน (penalty_fee รวม overdue + condition fee แล้ว)
      const totalDeduction = borrowRecord.penalty_fee || 0;
      if (totalDeduction > 0) {
        await connection.query(`UPDATE users SET penalty = penalty + ? WHERE _id = ?`, [totalDeduction, borrowRecord.user_id]);

        // บันทึก Transaction Log
        const condition = borrowRecord.asset_condition;
        let txType = 'overdue_penalty';
        if (condition === 'lost') txType = 'lost_fee';
        else if (condition === 'damaged') txType = 'damage_fee';

        const txDesc = `คืน ${borrowRecord.electotronixPN} (x${borrowRecord.quantity}) | สภาพ: ${condition || 'good'} | เพิ่มค่าปรับ ฿${totalDeduction.toLocaleString()}`;
        await connection.query(
          `INSERT INTO tbl_transactions (user_id, borrow_id, type, amount, description) VALUES (?, ?, ?, ?, ?)`,
          [borrowRecord.user_id, borrowId, txType, totalDeduction, txDesc]
        );
      }

      let returnTitle = 'คืนอุปกรณ์สำเร็จ ✅';
      let returnMsg = `อนุมัติการคืน ${borrowRecord.electotronixPN} เรียบร้อยแล้ว`;
      if (borrowRecord.asset_condition === 'lost') {
        returnTitle = 'ยืนยันอุปกรณ์สูญหาย ⚠️';
        returnMsg = `Admin ยืนยันการสูญหายของ ${borrowRecord.electotronixPN}${totalDeduction > 0 ? ` | ค่าปรับ ฿${totalDeduction.toLocaleString()}` : ''}`;
      } else if (borrowRecord.asset_condition === 'damaged') {
        returnTitle = 'ยืนยันอุปกรณ์ชำรุด ⚠️';
        returnMsg = `Admin ยืนยันการชำรุดของ ${borrowRecord.electotronixPN}${totalDeduction > 0 ? ` | ค่าปรับ ฿${totalDeduction.toLocaleString()}` : ''}`;
      } else if (totalDeduction > 0) {
        returnMsg += ` | ค่าปรับล่าช้า ฿${totalDeduction.toLocaleString()}`;
      }
      await connection.query(
        `INSERT INTO tbl_notifications (user_id, title, message) VALUES (?, ?, ?)`,
        [borrowRecord.user_id, returnTitle, returnMsg]
      );
      try { getIO().to(`user_${borrowRecord.user_id}`).emit('new_notification', { title: returnTitle, message: returnMsg }); } catch (e) { }
    }

    await connection.commit();
    res.json({ message: 'ดำเนินการสำเร็จ' });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500); throw new Error(error.message);
  } finally {
    await closeConn(connection);
  }
});

// -----------------------------------------------------------------------------------
// 🚀 5. Admin ปฏิเสธรูปภาพ (ปรับเงินกรณีทุจริต หรือ ให้ถ่ายรูปใหม่)
const rejectReturn = asyncHandler(async (req, res) => {
  const borrowId = req.params.id;
  const { penalty, reason } = req.body;
  const connection = await connectToDatabase();

  try {
    const [borrows] = await connection.query(`
      SELECT b.*, p.electotronixPN, p.is_longterm 
      FROM tbl_borrow b 
      JOIN tbl_product p ON b.product_id = p.ID WHERE b.id = ?`, [borrowId]);
    const borrowRecord = borrows[0];

    if (!borrowRecord) { res.status(404); throw new Error('ไม่พบข้อมูลการยืม'); }

    await connection.beginTransaction();

    const finalPenalty = penalty ? parseFloat(penalty) : (borrowRecord.penalty_fee || 0);

    if (finalPenalty > 0) {
      await connection.query(`UPDATE users SET penalty = penalty + ? WHERE _id = ?`, [finalPenalty, borrowRecord.user_id]);
    }

    // ดีดสถานะกลับไปเป็น active เพื่อให้ User ส่งรูปใหม่ ไม่ว่าจะเป็นของระยะสั้นหรือยาว
    await connection.query(
      `UPDATE tbl_borrow 
       SET status = 'active', 
           return_image = NULL, 
           is_checkin = 0,
           asset_condition = NULL,
           penalty_fee = 0 
       WHERE id = ?`,
      [borrowId]
    );

    // ตั้งชื่อเตือนให้ตรงกับประเภท
    const titleType = borrowRecord.is_longterm ? 'รายงานสถานะไม่ผ่าน ❌' : 'ตรวจพบการทุจริต! ❌';
    const actionType = borrowRecord.is_longterm ? 'การตรวจสอบ' : 'การคืน';
    const msg = `${actionType} ${borrowRecord.electotronixPN} ถูกปฏิเสธ: ${reason || 'รูปภาพไม่ถูกต้อง'} ${finalPenalty > 0 ? `| โดนหักเครดิตลงโทษ: ฿${finalPenalty.toLocaleString()}` : ''}`;

    await connection.query(
      `INSERT INTO tbl_notifications (user_id, title, message) VALUES (?, ?, ?)`,
      [borrowRecord.user_id, titleType, msg]
    );
    try { getIO().to(`user_${borrowRecord.user_id}`).emit('new_notification', { title: titleType, message: msg }); } catch (e) { }

    await connection.commit();
    res.json({ message: 'ปฏิเสธหลักฐานเรียบร้อย ให้ผู้ใช้ดำเนินการใหม่' });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500); throw new Error(error.message);
  } finally {
    await closeConn(connection);
  }
});

// -----------------------------------------------------------------------------------
// 🚀 6. ดึงประวัติการยืมส่วนตัว
const getMyBorrowHistory = asyncHandler(async (req, res) => {
  let token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401); throw new Error('กรุณาล็อกอิน'); }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const connection = await connectToDatabase();

  try {
    // ดึงประวัติการยืม — safe fallback: ค่อยๆ เพิ่ม column ถ้ามี
    let history = [];
    try {
      const [rows] = await connection.query(`
        SELECT b.id, b.user_id, b.product_id, b.quantity, b.status,
               b.borrow_date, b.due_date, b.return_date, b.return_image,
               b.penalty_fee, b.asset_condition,
               p.electotronixPN, p.category, p.img, p.price
        FROM tbl_borrow b
        JOIN tbl_product p ON b.product_id = p.ID
        WHERE b.user_id = ?
        ORDER BY b.borrow_date DESC`, [decoded.id]);
      history = rows;
    } catch (err) {
      // ถ้า tbl_borrow ยังไม่มี — return empty
      if (err.message && (err.message.includes('doesn\'t exist') || err.message.includes('Unknown'))) {
        history = [];
      } else {
        throw err;
      }
    }

    // ดึงค่าปรับ ปัจจุบันของ user
    let penalty = 0;
    try {
      const [userRows] = await connection.query(
        'SELECT penalty FROM users WHERE _id = ?', [decoded.id]
      );
      penalty = userRows[0]?.penalty || 0;
    } catch (e) { /* column penalty อาจยังไม่มีใน users */ }

    // คำนวณค่าปรับทั้งหมดที่โดนหักไป
    let totalPenalty = 0;
    try {
      const [penaltyRows] = await connection.query(
        'SELECT IFNULL(SUM(penalty_fee), 0) as totalPenalty FROM tbl_borrow WHERE user_id = ? AND penalty_fee > 0', [decoded.id]
      );
      totalPenalty = penaltyRows[0]?.totalPenalty || 0;
    } catch (e) { /* tbl_borrow อาจยังไม่มี */ }

    res.json({ history, penalty, totalPenalty });
  } finally {
    await closeConn(connection);
  }
});

// -----------------------------------------------------------------------------------
// 🚀 7. Admin แก้ไขจำนวนการเบิก
const updateBorrowQty = asyncHandler(async (req, res) => {
  const borrowId = req.params.id;
  const { qty } = req.body;

  const newQty = Number(qty);
  if (!newQty || newQty <= 0 || !Number.isInteger(newQty)) {
    res.status(400);
    throw new Error('จำนวนต้องเป็นจำนวนเต็มบวก');
  }

  const connection = await connectToDatabase();
  try {
    const [borrows] = await connection.query(
      `SELECT b.*, p.electotronixPN, p.quantity AS currentStock
       FROM tbl_borrow b
       JOIN tbl_product p ON b.product_id = p.ID
       WHERE b.id = ?`, [borrowId]
    );
    const borrowRecord = borrows[0];

    if (!borrowRecord || borrowRecord.status !== 'pending_approval') {
      res.status(400);
      throw new Error('รายการนี้ไม่อยู่ในสถานะรออนุมัติเบิก ไม่สามารถแก้ไขจำนวนได้');
    }

    if (borrowRecord.currentStock < newQty) {
      res.status(400);
      throw new Error(`สต๊อก ${borrowRecord.electotronixPN} ไม่เพียงพอ (เหลือ ${borrowRecord.currentStock})`);
    }

    await connection.query('UPDATE tbl_borrow SET quantity = ? WHERE id = ?', [newQty, borrowId]);

    res.json({ message: 'อัปเดตจำนวนเรียบร้อย' });
  } finally {
    await closeConn(connection);
  }
});

module.exports = {
  createBorrowRecord,
  approveBorrow,
  rejectBorrow,
  getAllPendingBorrows,
  getMyBorrowHistory,
  requestReturn,
  approveReturn,
  rejectReturn,
  getAllPendingReturns,
  updateBorrowQty
};