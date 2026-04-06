// src/controllers/adminController.js
const asyncHandler = require('../middleware/asyncHandler.js');
const connectToDatabase = require('../config/db.js');

// ========================================================
// 🚀 ฟังก์ชันคำนวณวันสิ้นเดือน (หลบเสาร์-อาทิตย์ ให้เป็นวันศุกร์)
const getWorkingEndOfMonth = (monthsToAdd = 1) => {
  let date = new Date();

  // เลื่อนไปเดือนถัดไป แล้วตั้งวันที่เป็น 0 (จะได้วันสุดท้ายของเดือนที่ต้องการ)
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

//  1. ดึงภาพรวมสถิติ
const getAdminStats = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  try {
    const [usersData] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [assetsData] = await connection.query('SELECT COUNT(*) as count FROM tbl_product');
    const [borrowedData] = await connection.query("SELECT IFNULL(SUM(quantity), 0) as count FROM tbl_borrow WHERE status IN ('active', 'pending_return')");
    const [penaltiesData] = await connection.query('SELECT IFNULL(SUM(penalty_fee), 0) as total FROM tbl_borrow');

    res.json({
      totalUsers: usersData[0].count,
      totalAssets: assetsData[0].count,
      borrowedItems: Number(borrowedData[0].count),
      penalties: Number(penaltiesData[0].total)
    });
  } finally {
    if (connection) connection.release();
  }
});

//  2. ดึงรายชื่อพนักงานทั้งหมด
const getAllUsers = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  try {
    const [users] = await connection.query('SELECT _id, name, email, penalty, isAdmin FROM users ORDER BY name ASC');
    res.json(users);
  } finally {
    if (connection) connection.release();
  }
});

// 3. ใหม่: ดึงรายการยืมที่ยังไม่คืนทั้งหมด (Global Deployment Log)
const getAllActiveBorrows = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  try {
    // 🚀 เพิ่มการดึง p.is_longterm มาด้วย เพื่อให้ Frontend แสดงป้ายกำกับได้ถูก
    const [activeBorrows] = await connection.query(`
      SELECT 
        b.ID as borrow_id, 
        u.name as operator_name, 
        p.electotronixPN, 
        p.category,
        p.is_longterm,
        b.quantity, 
        b.due_date, 
        b.status
      FROM tbl_borrow b
      JOIN users u ON b.user_id = u._id
      JOIN tbl_product p ON b.product_id = p.ID
      WHERE b.status IN ('active', 'pending_return')
      ORDER BY b.due_date ASC
    `);
    res.json(activeBorrows);
  } finally {
    if (connection) connection.release();
  }
});

// 4. ใหม่: ดึงรายละเอียดการยืมรายบุคคล (Operator Tactical View)
const getUserBorrowDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const connection = await connectToDatabase();
  try {
    // 🚀 เพิ่มการดึง p.is_longterm
    const [borrowedItems] = await connection.query(`
      SELECT 
        b.ID as borrow_id, 
        p.electotronixPN, 
        p.category, 
        p.img,
        p.is_longterm,
        b.quantity, 
        b.borrow_date, 
        b.due_date, 
        b.status
      FROM tbl_borrow b
      JOIN tbl_product p ON b.product_id = p.ID
      WHERE b.user_id = ? AND b.status IN ('active', 'pending_return')
      ORDER BY b.borrow_date DESC
    `, [id]);

    res.json(borrowedItems);
  } finally {
    if (connection) connection.release();
  }
});

// 5. แก้ไขเครดิตพนักงาน (เปลี่ยนเป็นจัดการค่าปรับ)
const updateUserCredit = asyncHandler(async (req, res) => {
  const { userId, newCredit } = req.body;
  const connection = await connectToDatabase();
  try {
    await connection.query('UPDATE users SET penalty = ? WHERE _id = ?', [newCredit, userId]);
    res.json({ message: 'CREDIT_SYNC_SUCCESS' });
  } finally {
    if (connection) connection.release();
  }
});

// 6. แก้ไขราคาอุปกรณ์
const updateProductPrice = asyncHandler(async (req, res) => {
  const { productId, newPrice } = req.body;
  const connection = await connectToDatabase();
  try {
    await connection.query('UPDATE tbl_product SET price = ? WHERE ID = ?', [newPrice, productId]);
    res.json({ message: 'PRICE_SYNC_SUCCESS' });
  } finally {
    if (connection) connection.release();
  }
});

// 7. แก้ไขจำนวนสต๊อกสินค้า
const updateProductQuantity = asyncHandler(async (req, res) => {
  const { productId, newQuantity } = req.body;
  const connection = await connectToDatabase();
  try {
    await connection.query('UPDATE tbl_product SET quantity = ? WHERE ID = ?', [newQuantity, productId]);
    res.json({ message: 'QUANTITY_SYNC_SUCCESS' });
  } finally {
    if (connection) connection.release();
  }
});

// 8. ใหม่: อนุมัติรับของคืนและบวกสต๊อกกลับเข้าคลัง
const approveReturn = asyncHandler(async (req, res) => {
  const { borrowId } = req.body;
  const connection = await connectToDatabase();

  try {
    await connection.beginTransaction();

    // 🚀 ดึง is_longterm มาเช็ค
    const [borrowRecord] = await connection.query(
      `SELECT b.product_id, b.quantity, b.status, p.is_longterm 
       FROM tbl_borrow b
       JOIN tbl_product p ON b.product_id = p.ID 
       WHERE b.ID = ?`,
      [borrowId]
    );

    if (borrowRecord.length === 0) {
      await connection.rollback();
      res.status(404);
      throw new Error('ไม่พบข้อมูลการยืม');
    }

    const { product_id, quantity, status, is_longterm } = borrowRecord[0];

    if (status === 'returned') {
      await connection.rollback();
      res.status(400);
      throw new Error('อุปกรณ์นี้ถูกคืนไปแล้ว');
    }

    // 🚀 ถ้าแอดมินกดรับของจากในหน้า Dashboard ให้แยกตามประเภท
    if (is_longterm) {
      // 🔵 ของระยะยาว: ทำการ "ยืมใหม่ให้อัตโนมัติ" ไปจนถึงศุกร์สิ้นเดือนหน้า
      const newDueDate = getWorkingEndOfMonth(1);

      await connection.query(
        'UPDATE tbl_borrow SET status = "active", due_date = ?, is_checkin = 0, asset_condition = NULL WHERE ID = ?',
        [newDueDate, borrowId]
      );
    } else {
      // 🟠 ของชั่วคราว: คืนของตามปกติ
      await connection.query(
        'UPDATE tbl_borrow SET status = "returned", return_date = NOW() WHERE ID = ?',
        [borrowId]
      );
      await connection.query(
        'UPDATE tbl_product SET quantity = quantity + ? WHERE ID = ?',
        [quantity, product_id]
      );
    }

    await connection.commit();
    res.json({ message: 'RETURN_APPROVED_SUCCESS' });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
});

// ========================================================
// 🚀 9. ดูประวัติธุรกรรมทั้งหมด (Transaction History)
const getTransactionHistory = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  try {
    // สร้างตารางอัตโนมัติถ้ายังไม่มี
    await connection.query(`
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

    const { page = 1, limit = 50, type, userId, month } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const params = [];

    if (type) {
      whereClause += ' AND t.type = ?';
      params.push(type);
    }
    if (userId) {
      whereClause += ' AND t.user_id = ?';
      params.push(userId);
    }
    if (month) {
      // month format: "2026-03"
      whereClause += ' AND DATE_FORMAT(t.created_at, "%Y-%m") = ?';
      params.push(month);
    }

    const [transactions] = await connection.query(`
      SELECT t.*, u.name AS userName, u.email AS userEmail
      FROM tbl_transactions t
      JOIN users u ON t.user_id = u._id
      WHERE ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, Number(limit), Number(offset)]);

    const [countResult] = await connection.query(`
      SELECT COUNT(*) as total FROM tbl_transactions t WHERE ${whereClause}
    `, params);

    // สรุปยอดรวม
    const [summary] = await connection.query(`
      SELECT 
        IFNULL(SUM(CASE WHEN type = 'overdue_penalty' THEN amount ELSE 0 END), 0) AS totalOverdue,
        IFNULL(SUM(CASE WHEN type = 'damage_fee' THEN amount ELSE 0 END), 0) AS totalDamage,
        IFNULL(SUM(CASE WHEN type = 'lost_fee' THEN amount ELSE 0 END), 0) AS totalLost,
        IFNULL(SUM(CASE WHEN type = 'force_return' THEN amount ELSE 0 END), 0) AS totalForceReturn,
        IFNULL(SUM(amount), 0) AS grandTotal
      FROM tbl_transactions t WHERE ${whereClause}
    `, params);

    res.json({
      transactions,
      total: countResult[0].total,
      page: Number(page),
      limit: Number(limit),
      summary: summary[0]
    });
  } finally {
    if (connection) connection.release();
  }
});

// ========================================================
// 🚀 10. Admin บังคับคืนอุปกรณ์ (Force Return)
const forceReturn = asyncHandler(async (req, res) => {
  const { borrowId, reason, penaltyPercent } = req.body;
  const connection = await connectToDatabase();

  try {
    await connection.beginTransaction();

    const [borrows] = await connection.query(`
      SELECT b.*, p.electotronixPN, p.price, p.is_longterm, u.name AS userName
      FROM tbl_borrow b
      JOIN tbl_product p ON b.product_id = p.ID
      JOIN users u ON b.user_id = u._id
      WHERE b.ID = ? AND b.status IN ('active', 'pending_return')
    `, [borrowId]);

    if (borrows.length === 0) {
      await connection.rollback();
      res.status(404);
      throw new Error('ไม่พบรายการยืมที่สามารถบังคับคืนได้');
    }

    const borrow = borrows[0];
    const percent = Math.min(Math.max(Number(penaltyPercent) || 100, 0), 100);
    const penaltyAmount = Math.round(Number(borrow.price) * borrow.quantity * (percent / 100));

    // หักเงิน (เปลี่ยนเป็นเพิ่ม Penalty)
    if (penaltyAmount > 0) {
      await connection.query('UPDATE users SET penalty = penalty + ? WHERE _id = ?', [penaltyAmount, borrow.user_id]);
    }

    // เปลี่ยนสถานะเป็น returned
    await connection.query('UPDATE tbl_borrow SET status = "returned", return_date = NOW(), penalty_fee = ?, asset_condition = "force_returned" WHERE ID = ?', [penaltyAmount, borrowId]);

    // ไม่บวกสต๊อกกลับ (บังคับคืน = ถือว่าของหาย/ไม่ได้คืนจริง)

    // บันทึก Transaction Log
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tbl_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL, borrow_id INT,
        type ENUM('overdue_penalty','damage_fee','lost_fee','credit_adjustment','force_return') NOT NULL,
        amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
        description TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const txDesc = `Admin บังคับคืน ${borrow.electotronixPN} (x${borrow.quantity}) | เหตุผล: ${reason || 'ไม่ระบุ'} | หัก ${percent}% = ฿${penaltyAmount.toLocaleString()}`;
    await connection.query(
      'INSERT INTO tbl_transactions (user_id, borrow_id, type, amount, description) VALUES (?, ?, ?, ?, ?)',
      [borrow.user_id, borrowId, 'force_return', penaltyAmount, txDesc]
    );

    // แจ้งเตือน
    const { getIO } = require('../socket');
    const nTitle = 'อุปกรณ์ถูกบังคับคืน ⛔';
    const nMsg = `Admin สั่งบังคับคืน ${borrow.electotronixPN}${penaltyAmount > 0 ? ` | หักเครดิต ฿${penaltyAmount.toLocaleString()}` : ''} | เหตุผล: ${reason || '-'}`;
    await connection.query(
      'INSERT INTO tbl_notifications (user_id, title, message) VALUES (?, ?, ?)',
      [borrow.user_id, nTitle, nMsg]
    );
    try { getIO().to(`user_${borrow.user_id}`).emit('new_notification', { title: nTitle, message: nMsg }); } catch (e) { }

    await connection.commit();
    res.json({ message: 'บังคับคืนอุปกรณ์สำเร็จ', penalty: penaltyAmount });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
});

// ========================================================
// 🚀 11. Admin ปรับเครดิตพร้อมบันทึก log เหตุผล
const adjustCredit = asyncHandler(async (req, res) => {
  const { userId, amount, reason } = req.body;
  const connection = await connectToDatabase();

  try {
    await connection.beginTransaction();

    // ดึงข้อมูล user ก่อน
    const [users] = await connection.query('SELECT _id, name, penalty FROM users WHERE _id = ?', [userId]);
    if (users.length === 0) {
      await connection.rollback();
      res.status(404);
      throw new Error('ไม่พบข้อมูลผู้ใช้');
    }

    const user = users[0];
    const adjustAmount = Number(amount);
    const newPenalty = Math.max(0, Number(user.penalty) + adjustAmount);

    await connection.query('UPDATE users SET penalty = ? WHERE _id = ?', [newPenalty, userId]);

    // บันทึก Transaction Log
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tbl_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL, borrow_id INT,
        type ENUM('overdue_penalty','damage_fee','lost_fee','credit_adjustment','force_return') NOT NULL,
        amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
        description TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const txDesc = `Admin ปรับค่าปรับ ${user.name}: ${adjustAmount >= 0 ? '+' : ''}฿${adjustAmount.toLocaleString()} | เหตุผล: ${reason || 'ไม่ระบุ'} | ยอดเดิม: ฿${Number(user.penalty).toLocaleString()} → ยอดใหม่: ฿${newPenalty.toLocaleString()}`;
    await connection.query(
      'INSERT INTO tbl_transactions (user_id, borrow_id, type, amount, description) VALUES (?, NULL, ?, ?, ?)',
      [userId, 'credit_adjustment', Math.abs(adjustAmount), txDesc]
    );

    // แจ้งเตือน
    const { getIO } = require('../socket');
    const nTitle = adjustAmount >= 0 ? 'ค่าปรับถูกเพิ่ม ⚠️' : 'ค่าปรับถูกลด ✅';
    const nMsg = `Admin ปรับค่าปรับของคุณ ${adjustAmount >= 0 ? '+' : ''}฿${adjustAmount.toLocaleString()} | เหตุผล: ${reason || '-'}`;
    await connection.query(
      'INSERT INTO tbl_notifications (user_id, title, message) VALUES (?, ?, ?)',
      [userId, nTitle, nMsg]
    );
    try { getIO().to(`user_${userId}`).emit('new_notification', { title: nTitle, message: nMsg }); } catch (e) { }

    await connection.commit();
    res.json({ message: 'ปรับค่าปรับสำเร็จ', newPenalty });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
});

// ========================================================
// 🚀 12. Admin กดลบข้อมูลเก่ากว่า 2 เดือน (Manual Cleanup)
const cleanupOldData = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  try {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const cutoffDate = twoMonthsAgo.toISOString().slice(0, 19).replace('T', ' ');

    // ลบประวัติการยืมที่คืนแล้ว (status = 'returned')
    const [borrowResult] = await connection.query(
      `DELETE FROM tbl_borrow WHERE status = 'returned' AND return_date < ?`,
      [cutoffDate]
    );

    // ลบประวัติธุรกรรม (tbl_transactions) 
    const [transResult] = await connection.query(
      `DELETE FROM tbl_transactions 
       WHERE created_at < ? 
         AND (
           borrow_id IS NULL 
           OR borrow_id NOT IN (SELECT id FROM tbl_borrow WHERE status != 'returned')
         )`,
      [cutoffDate]
    );

    res.json({
      message: 'CLEANUP_SUCCESS',
      deletedBorrows: borrowResult.affectedRows,
      deletedTransactions: transResult.affectedRows,
      cutoffDate
    });
  } catch (error) {
    throw error;
  } finally {
    if (connection) connection.release();
  }
});

module.exports = {
  getAdminStats,
  getAllUsers,
  getAllActiveBorrows,
  getUserBorrowDetails,
  updateUserCredit,
  updateProductPrice,
  updateProductQuantity,
  approveReturn,
  getTransactionHistory,
  forceReturn,
  adjustCredit,
  cleanupOldData
};