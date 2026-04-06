const asyncHandler = require('../middleware/asyncHandler.js');
const connectToDatabase = require('../config/db.js');
const jwt = require('jsonwebtoken');
const { getIO } = require('../socket');
const path = require('path');

// ========================================================
const getWorkingEndOfMonth = (monthsToAdd = 1) => {
  let date = new Date();
  date.setMonth(date.getMonth() + monthsToAdd + 1);
  date.setDate(0);
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 6) date.setDate(date.getDate() - 1);
  else if (dayOfWeek === 0) date.setDate(date.getDate() - 2);
  date.setHours(23, 59, 59, 999);
  return date;
};
// ========================================================

const closeConn = async (conn) => {
  if (!conn) return;
  try {
    if (typeof conn.release === 'function') await conn.release();
    else if (typeof conn.end === 'function') await conn.end();
  } catch (err) {
    console.error("❌ Error closing connection:", err.message);
  }
};

// 🔒 Safe query — return empty on missing table/column
const safeQuery = async (conn, sql, params = []) => {
  try {
    return await conn.query(sql, params);
  } catch (err) {
    console.log('⚠️ Borrow query fallback:', err.message);
    return [[]];
  }
};

// Safe notification insert
const safeNotify = async (conn, userId, title, message) => {
  try {
    await conn.query(
      'INSERT INTO tbl_notifications (user_id, title, message) VALUES (?, ?, ?)',
      [userId, title, message]
    );
    try { getIO().to(`user_${userId}`).emit('new_notification', { title, message }); } catch (e) {}
  } catch (e) { /* notifications table may not exist */ }
};

// -----------------------------------------------------------------------------------
// 1. ฟังก์ชันขอเบิกของ
const createBorrowRecord = asyncHandler(async (req, res) => {
  const { cartItems } = req.body;
  let token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401); throw new Error('กรุณาล็อกอินก่อนทำรายการ'); }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const connection = await connectToDatabase();

  try {
    // Check user penalty
    const [userCheck] = await safeQuery(connection, 'SELECT penalty FROM users WHERE _id = ?', [decoded.id]);
    const currentPenalty = userCheck[0]?.penalty || 0;

    if (currentPenalty > 0) {
      res.status(403);
      throw new Error(`ไม่สามารถทำรายการได้เนื่องจากคุณมียอดค่าปรับค้างชำระ (฿${Math.abs(currentPenalty).toLocaleString()}) กรุณาชำระค่าปรับก่อนใช้งาน`);
    }

    await connection.beginTransaction();

    for (let item of cartItems) {
      const [stockCheck] = await safeQuery(connection, 'SELECT quantity, is_longterm FROM tbl_product WHERE ID = ?', [item.ID]);

      // Validate borrowQty > 0
      const qty = Number(item.borrowQty);
      if (!qty || qty <= 0 || !Number.isInteger(qty)) {
        throw new Error(`จำนวนเบิกต้องเป็นจำนวนเต็มบวก (สินค้า ${item.electotronixPN || item.ID})`);
      }

      if (stockCheck.length === 0 || stockCheck[0].quantity < qty) {
        throw new Error(`สินค้ารหัส ${item.electotronixPN} มีสต๊อกไม่เพียงพอ`);
      }

      const isLongTerm = stockCheck[0].is_longterm || 0;
      let dueDate;
      if (isLongTerm) {
        dueDate = getWorkingEndOfMonth(1);
      } else {
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
// 1.1 Admin อนุมัติการเบิกของ
const approveBorrow = asyncHandler(async (req, res) => {
  const borrowId = req.params.id;
  const connection = await connectToDatabase();

  try {
    await connection.beginTransaction();

    const [borrows] = await safeQuery(connection, `
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

    await safeQuery(connection, 'UPDATE tbl_product SET quantity = quantity - ? WHERE ID = ?', [borrowRecord.quantity, borrowRecord.product_id]);
    await safeQuery(connection, "UPDATE tbl_borrow SET status = 'active' WHERE id = ?", [borrowId]);

    await safeNotify(connection, borrowRecord.user_id, 'อนุมัติการเบิกสำเร็จ ✅',
      `Admin อนุมัติให้คุณเบิก ${borrowRecord.electotronixPN} จำนวน ${borrowRecord.quantity} ชิ้น เรียบร้อยแล้ว`);

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
// 1.2 Admin ปฏิเสธการเบิกของ
const rejectBorrow = asyncHandler(async (req, res) => {
  const borrowId = req.params.id;
  const connection = await connectToDatabase();

  try {
    const [borrows] = await safeQuery(connection, `
      SELECT b.*, p.electotronixPN
      FROM tbl_borrow b
      JOIN tbl_product p ON b.product_id = p.ID
      WHERE b.id = ?`, [borrowId]);
    const borrowRecord = borrows[0];

    if (!borrowRecord || borrowRecord.status !== 'pending_approval') {
      res.status(400); throw new Error('รายการนี้ไม่อยู่ในสถานะรออนุมัติเบิก');
    }

    await connection.beginTransaction();
    await connection.query('DELETE FROM tbl_borrow WHERE id = ?', [borrowId]);

    await safeNotify(connection, borrowRecord.user_id, 'คำขอเบิกถูกปฏิเสธ ❌',
      `Admin ไม่อนุมัติการเบิก ${borrowRecord.electotronixPN} ของคุณ`);

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
// 1.3 ดึงรายการรออนุมัติเบิก (สำหรับ Admin)
const getAllPendingBorrows = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  try {
    const [pendingList] = await safeQuery(connection, `
      SELECT b.id, b.user_id, b.product_id, b.quantity, b.status, b.borrow_date,
             p.electotronixPN, p.img, u.name AS userName
      FROM tbl_borrow b
      JOIN tbl_product p ON b.product_id = p.ID
      JOIN users u ON b.user_id = u._id
      WHERE b.status = 'pending_approval'
      ORDER BY b.borrow_date ASC
    `);
    res.json(pendingList[0] || []);
  } finally {
    await closeConn(connection);
  }
});

// -----------------------------------------------------------------------------------
// 2. ดึงรายการรอตรวจสอบคืนของ (สำหรับ Admin)
const getAllPendingReturns = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  try {
    const [pendingList] = await safeQuery(connection, `
      SELECT b.id, b.user_id, b.product_id, b.quantity, b.status, b.return_date,
             b.penalty_fee, b.asset_condition,
             p.electotronixPN, p.price AS productPrice,
             u.name AS userName, u.penalty AS userCredit
      FROM tbl_borrow b
      JOIN tbl_product p ON b.product_id = p.ID
      JOIN users u ON b.user_id = u._id
      WHERE b.status = 'pending_return'
      ORDER BY b.return_date ASC
    `);
    res.json(pendingList[0] || []);
  } finally {
    await closeConn(connection);
  }
});

// -----------------------------------------------------------------------------------
// 3. User ส่งคืนของ หรือ ถ่ายรูปเช็คสถานะ
const requestReturn = asyncHandler(async (req, res) => {
  const borrowId = req.params.id;

  let token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401); throw new Error('กรุณาล็อกอินก่อนทำรายการ'); }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const isCheckIn = req.body.is_checkin === 'true' ? 1 : 0;
  const assetCondition = req.body.asset_condition || null;

  if (!req.file && assetCondition !== 'lost') {
    res.status(400); throw new Error('กรุณาแนบรูปภาพหลักฐาน');
  }

  const imgUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const connection = await connectToDatabase();

  try {
    const [borrows] = await safeQuery(connection,
      `SELECT b.id, b.user_id, b.quantity, b.due_date, b.penalty_fee, p.price AS productPrice
       FROM tbl_borrow b
       JOIN tbl_product p ON b.product_id = p.ID
       WHERE b.id = ?`, [borrowId]);
    const borrowRecord = borrows[0];
    if (!borrowRecord) { res.status(404); throw new Error('ไม่พบข้อมูลการยืม'); }

    let overduePenalty = 0;
    let conditionPenalty = 0;
    const now = new Date();
    const dueDate = new Date(borrowRecord.due_date);
    const unitPrice = Number(borrowRecord.productPrice) || 0;

    if (!isCheckIn && now > dueDate) {
      const diffDays = Math.ceil(Math.abs(now - dueDate) / (1000 * 60 * 60 * 24));
      overduePenalty = diffDays * 50;
    }

    if (assetCondition === 'damaged') {
      conditionPenalty = Math.round(unitPrice * borrowRecord.quantity * 0.5);
    } else if (assetCondition === 'lost') {
      conditionPenalty = Math.round(unitPrice * borrowRecord.quantity * 1.0);
    }

    const totalPenalty = overduePenalty + conditionPenalty;

    // Try full update first (with all columns), fallback to minimal
    try {
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
    } catch (e) {
      // Some columns don't exist — update what we have
      await connection.query(
        `UPDATE tbl_borrow SET status = 'pending_return', return_date = NOW() WHERE id = ?`,
        [borrowId]
      );
    }

    res.json({
      message: 'ส่งหลักฐานเรียบร้อย รอแอดมินตรวจสอบ',
      penalty: totalPenalty,
      breakdown: { overdue: overduePenalty, condition: conditionPenalty }
    });
  } finally {
    await closeConn(connection);
  }
});

// -----------------------------------------------------------------------------------
// 4. Admin อนุมัติคืนของ
const approveReturn = asyncHandler(async (req, res) => {
  const borrowId = req.params.id;
  const connection = await connectToDatabase();

  try {
    const [borrows] = await safeQuery(connection, `
      SELECT b.id, b.user_id, b.product_id, b.quantity, b.status, b.penalty_fee,
             p.electotronixPN, p.price AS productPrice
      FROM tbl_borrow b
      JOIN tbl_product p ON b.product_id = p.ID
      WHERE b.id = ?`, [borrowId]);
    const borrowRecord = borrows[0];

    if (!borrowRecord || borrowRecord.status !== 'pending_return') {
      res.status(400); throw new Error('รายการนี้ไม่อยู่ในสถานะรอตรวจสอบ');
    }

    await connection.beginTransaction();

    // Mark as returned + return stock
    await safeQuery(connection, "UPDATE tbl_borrow SET status = 'returned', return_date = NOW() WHERE id = ?", [borrowId]);
    await safeQuery(connection, 'UPDATE tbl_product SET quantity = quantity + ? WHERE ID = ?', [borrowRecord.quantity, borrowRecord.product_id]);

    // Add penalty if any
    if (borrowRecord.penalty_fee > 0) {
      await safeQuery(connection, 'UPDATE users SET penalty = penalty + ? WHERE _id = ?', [borrowRecord.penalty_fee, borrowRecord.user_id]);
    }

    await safeNotify(connection, borrowRecord.user_id, 'คืนอุปกรณ์สำเร็จ ✅',
      `อนุมัติการคืน ${borrowRecord.electotronixPN} เรียบร้อยแล้ว`);

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
// 5. Admin ปฏิเสธรูปภาพ
const rejectReturn = asyncHandler(async (req, res) => {
  const borrowId = req.params.id;
  const { penalty, reason } = req.body;
  const connection = await connectToDatabase();

  try {
    const [borrows] = await safeQuery(connection, `
      SELECT b.id, b.user_id, b.electotronixPN, b.penalty_fee,
             p.electotronixPN as productPN
      FROM tbl_borrow b
      JOIN tbl_product p ON b.product_id = p.ID
      WHERE b.id = ?`, [borrowId]);
    const borrowRecord = borrows[0];

    if (!borrowRecord) { res.status(404); throw new Error('ไม่พบข้อมูลการยืม'); }

    await connection.beginTransaction();

    const finalPenalty = penalty ? parseFloat(penalty) : 0;
    if (finalPenalty > 0) {
      await safeQuery(connection, 'UPDATE users SET penalty = penalty + ? WHERE _id = ?', [finalPenalty, borrowRecord.user_id]);
    }

    await safeQuery(connection,
      "UPDATE tbl_borrow SET status = 'active', return_image = NULL, penalty_fee = 0 WHERE id = ?",
      [borrowId]
    );

    const msg = `การคืน ${borrowRecord.productPN} ถูกปฏิเสธ: ${reason || 'รูปภาพไม่ถูกต้อง'} ${finalPenalty > 0 ? `| โดนหักเครดิต: ฿${finalPenalty.toLocaleString()}` : ''}`;
    await safeNotify(connection, borrowRecord.user_id, 'ตรวจพบการทุจริต! ❌', msg);

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
// 6. ดึงประวัติการยืมส่วนตัว
const getMyBorrowHistory = asyncHandler(async (req, res) => {
  let token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401); throw new Error('กรุณาล็อกอิน'); }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const connection = await connectToDatabase();

  try {
    let history = [];
    try {
      const [rows] = await connection.query(`
        SELECT b.id, b.user_id, b.product_id, b.quantity, b.status,
               b.borrow_date, b.due_date, b.return_date,
               p.electotronixPN, p.category, p.img, p.price
        FROM tbl_borrow b
        JOIN tbl_product p ON b.product_id = p.ID
        WHERE b.user_id = ?
        ORDER BY b.borrow_date DESC`, [decoded.id]);
      history = rows;
    } catch (err) {
      if (!err.message.includes('exist')) throw err;
    }

    // Get user penalty
    let penalty = 0;
    try {
      const [userRows] = await connection.query('SELECT penalty FROM users WHERE _id = ?', [decoded.id]);
      penalty = userRows[0]?.penalty || 0;
    } catch (e) {}

    res.json({ history, penalty, totalPenalty: 0 });
  } finally {
    await closeConn(connection);
  }
});

// -----------------------------------------------------------------------------------
// 7. Admin แก้ไขจำนวนการเบิก
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
    const [borrows] = await safeQuery(connection, `
      SELECT b.id, b.status, b.product_id, b.quantity,
             p.electotronixPN, p.quantity AS currentStock
      FROM tbl_borrow b
      JOIN tbl_product p ON b.product_id = p.ID
      WHERE b.id = ?`, [borrowId]);
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
