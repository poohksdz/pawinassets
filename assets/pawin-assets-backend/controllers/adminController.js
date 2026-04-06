// src/controllers/adminController.js
const asyncHandler = require('../middleware/asyncHandler.js');
const connectToDatabase = require('../config/db.js');

// ========================================================
// 🚀 Safe query helper — return empty on missing table/column
const safeQuery = async (conn, sql) => {
  try {
    return await conn.query(sql);
  } catch (err) {
    console.log('⚠️ Query fallback:', err.message);
    return [[]];
  }
};
// ========================================================

// 1. ดึงภาพรวมสถิติ
const getAdminStats = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  try {
    const [usersData] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [assetsData] = await connection.query('SELECT COUNT(*) as count FROM tbl_product');

    let borrowedItems = 0;
    let penalties = 0;
    try {
      const [borrowedData] = await connection.query("SELECT IFNULL(SUM(quantity), 0) as count FROM tbl_borrow WHERE status IN ('active', 'pending_return')");
      borrowedItems = Number(borrowedData[0]?.[0]?.count || 0);
    } catch (e) {}

    try {
      const [penaltiesData] = await connection.query('SELECT IFNULL(SUM(penalty_fee), 0) as total FROM tbl_borrow');
      penalties = Number(penaltiesData[0]?.[0]?.total || 0);
    } catch (e) {}

    res.json({
      totalUsers: usersData[0]?.[0]?.count || 0,
      totalAssets: assetsData[0]?.[0]?.count || 0,
      borrowedItems,
      penalties
    });
  } finally {
    if (connection) connection.release();
  }
});

// 2. ดึงรายชื่อพนักงานทั้งหมด
const getAllUsers = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  try {
    // Try with penalty column, fallback without it
    const [users] = await safeQuery(connection, 'SELECT _id, name, email, penalty, isAdmin FROM users ORDER BY name ASC');
    res.json(users[0] && users[0].length > 0 ? users[0] : []);
  } finally {
    if (connection) connection.release();
  }
});

// 3. ดึงรายการยืมที่ยังไม่คืนทั้งหมด
const getAllActiveBorrows = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  try {
    const [activeBorrows] = await safeQuery(connection, `
      SELECT
        b.id as borrow_id,
        u.name as operator_name,
        p.electotronixPN,
        p.category,
        IFNULL(p.is_longterm, 0) as is_longterm,
        b.quantity,
        b.due_date,
        b.status
      FROM tbl_borrow b
      JOIN users u ON b.user_id = u._id
      JOIN tbl_product p ON b.product_id = p.ID
      WHERE b.status IN ('active', 'pending_return')
      ORDER BY b.due_date ASC
    `);
    res.json(activeBorrows[0] || []);
  } finally {
    if (connection) connection.release();
  }
});

// 4. ดึงรายละเอียดการยืมรายบุคคล
const getUserBorrowDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const connection = await connectToDatabase();
  try {
    const [borrowedItems] = await safeQuery(connection, `
      SELECT
        b.id as borrow_id,
        p.electotronixPN,
        p.category,
        p.img,
        b.quantity,
        b.borrow_date,
        b.due_date,
        b.status
      FROM tbl_borrow b
      JOIN tbl_product p ON b.product_id = p.ID
      WHERE b.user_id = ${id} AND b.status IN ('active', 'pending_return')
      ORDER BY b.borrow_date DESC
    `);
    res.json(borrowedItems[0] || []);
  } finally {
    if (connection) connection.release();
  }
});

// 5. แก้ไขเครดิตพนักงาน
const updateUserCredit = asyncHandler(async (req, res) => {
  const { userId, newCredit } = req.body;
  const connection = await connectToDatabase();
  try {
    await connection.query('UPDATE users SET penalty = IFNULL(penalty, 0) + ? WHERE _id = ?', [newCredit, userId]);
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

// 8. อนุมัติรับของคืน
const approveReturn = asyncHandler(async (req, res) => {
  const { borrowId } = req.body;
  const connection = await connectToDatabase();

  try {
    await connection.beginTransaction();

    const [borrowRecord] = await connection.query(
      `SELECT b.product_id, b.quantity, b.status
       FROM tbl_borrow b
       WHERE b.id = ?`,
      [borrowId]
    );

    if (borrowRecord.length === 0) {
      await connection.rollback();
      res.status(404);
      throw new Error('ไม่พบข้อมูลการยืม');
    }

    const { product_id, quantity, status } = borrowRecord[0];

    if (status === 'returned') {
      await connection.rollback();
      res.status(400);
      throw new Error('อุปกรณ์นี้ถูกคืนไปแล้ว');
    }

    // คืนของ + บวกสต๊อก
    await connection.query(
      'UPDATE tbl_borrow SET status = "returned", return_date = NOW() WHERE id = ?',
      [borrowId]
    );
    await connection.query(
      'UPDATE tbl_product SET quantity = quantity + ? WHERE ID = ?',
      [quantity, product_id]
    );

    await connection.commit();
    res.json({ message: 'RETURN_APPROVED_SUCCESS' });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
});

// 9. ดูประวัติธุรกรรม
const getTransactionHistory = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    try {
      const [transactions] = await connection.query(`
        SELECT t.*, u.name AS userName, u.email AS userEmail
        FROM tbl_transactions t
        JOIN users u ON t.user_id = u._id
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?
      `, [Number(limit), Number(offset)]);

      const [countResult] = await connection.query(
        'SELECT COUNT(*) as total FROM tbl_transactions t'
      );

      res.json({
        transactions: transactions[0] || [],
        total: countResult[0]?.[0]?.total || 0,
        page: Number(page),
        limit: Number(limit),
        summary: { totalOverdue: 0, totalDamage: 0, totalLost: 0, totalForceReturn: 0, grandTotal: 0 }
      });
    } catch (e) {
      // Table doesn't exist
      res.json({
        transactions: [],
        total: 0,
        page: Number(page),
        limit: Number(limit),
        summary: { totalOverdue: 0, totalDamage: 0, totalLost: 0, totalForceReturn: 0, grandTotal: 0 }
      });
    }
  } finally {
    if (connection) connection.release();
  }
});

// 10. Admin บังคับคืนอุปกรณ์
const forceReturn = asyncHandler(async (req, res) => {
  const { borrowId } = req.body;
  const connection = await connectToDatabase();

  try {
    const [borrows] = await connection.query(`
      SELECT b.id, b.user_id, b.product_id, b.quantity, b.status, b.penalty_fee,
             p.electotronixPN, p.price
      FROM tbl_borrow b
      JOIN tbl_product p ON b.product_id = p.ID
      WHERE b.id = ? AND b.status IN ('active', 'pending_return')
    `, [borrowId]);

    if (borrows.length === 0) {
      res.status(404);
      throw new Error('ไม่พบรายการยืม');
    }

    const borrow = borrows[0];

    await connection.query(
      'UPDATE tbl_borrow SET status = "returned", return_date = NOW() WHERE id = ?',
      [borrowId]
    );

    res.json({ message: 'บังคับคืนอุปกรณ์สำเร็จ' });
  } finally {
    if (connection) connection.release();
  }
});

// 11. Admin ปรับเครดิต
const adjustCredit = asyncHandler(async (req, res) => {
  const { userId, amount } = req.body;
  const connection = await connectToDatabase();

  try {
    const [users] = await connection.query('SELECT _id, name, penalty FROM users WHERE _id = ?', [userId]);
    if (users.length === 0) {
      res.status(404);
      throw new Error('ไม่พบข้อมูลผู้ใช้');
    }

    const user = users[0];
    const adjustAmount = Number(amount);
    const newPenalty = Math.max(0, Number(user.penalty || 0) + adjustAmount);

    await connection.query('UPDATE users SET penalty = ? WHERE _id = ?', [newPenalty, userId]);

    res.json({ message: 'ปรับค่าปรับสำเร็จ', newPenalty });
  } finally {
    if (connection) connection.release();
  }
});

// 12. Admin กดลบข้อมูลเก่า
const cleanupOldData = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  try {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const cutoffDate = twoMonthsAgo.toISOString().slice(0, 19).replace('T', ' ');

    const [borrowResult] = await safeQuery(connection,
      `DELETE FROM tbl_borrow WHERE status = 'returned' AND return_date < '${cutoffDate}'`
    );

    const [transResult] = await safeQuery(connection,
      `DELETE FROM tbl_transactions WHERE created_at < '${cutoffDate}'`
    );

    res.json({
      message: 'CLEANUP_SUCCESS',
      deletedBorrows: (borrowResult[0]?.affectedRows) || 0,
      deletedTransactions: (transResult[0]?.affectedRows) || 0,
      cutoffDate
    });
  } finally {
    if (connection) connection.release();
  }
});

// 13. รายงานสรุปข้อมูลสำหรับ Admin
const getAdminReport = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  try {
    const { dateFrom, dateTo } = req.query;

    // Summary
    const [assetsData] = await safeQuery(connection, 'SELECT COUNT(*) as count FROM tbl_product');
    const [borrowData] = await safeQuery(connection,
      "SELECT COUNT(*) as count FROM tbl_borrow WHERE status IN ('active', 'pending_return', 'returned', 'cancelled')"
    );
    const [returnsData] = await safeQuery(connection,
      "SELECT COUNT(*) as count FROM tbl_borrow WHERE status = 'returned'"
    );
    const [penaltyData] = await safeQuery(connection, 'SELECT IFNULL(SUM(penalty_fee), 0) as total FROM tbl_borrow');

    // Category stats
    const [categoryStats] = await safeQuery(connection, `
      SELECT category, COUNT(*) as count
      FROM tbl_product
      WHERE category IS NOT NULL AND category != ''
      GROUP BY category ORDER BY count DESC
    `);

    // Monthly borrows
    const [monthlyBorrows] = await safeQuery(connection, `
      SELECT
        DATE_FORMAT(borrow_date, '%b %Y') as month,
        COUNT(*) as borrows,
        SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) as returns
      FROM tbl_borrow
      GROUP BY month ORDER BY borrow_date DESC LIMIT 12
    `);

    // Top borrowed assets
    const [topBorrowed] = await safeQuery(connection, `
      SELECT p.electotronixPN, p.img, COUNT(b.id) as borrows
      FROM tbl_borrow b
      JOIN tbl_product p ON b.product_id = p.ID
      GROUP BY p.id, p.electotronixPN, p.img
      ORDER BY borrows DESC LIMIT 10
    `);

    // Penalty by user
    const [penaltyByUser] = await safeQuery(connection, `
      SELECT u.name, IFNULL(SUM(b.penalty_fee), 0) as totalPenalty,
             SUM(CASE WHEN b.status = 'returned' AND b.penalty_fee > 0 THEN 1 ELSE 0 END) as overdueCount
      FROM tbl_borrow b
      JOIN users u ON b.user_id = u._id
      WHERE b.penalty_fee > 0
      GROUP BY u._id, u.name
      ORDER BY totalPenalty DESC LIMIT 10
    `);

    res.json({
      summary: {
        totalAssets: assetsData[0]?.[0]?.count || 0,
        totalBorrows: borrowData[0]?.[0]?.count || 0,
        totalReturns: returnsData[0]?.[0]?.count || 0,
        totalPenalty: Number(penaltyData[0]?.[0]?.total || 0),
      },
      categoryStats: categoryStats[0] || [],
      monthlyBorrows: monthlyBorrows[0] || [],
      topBorrowed: topBorrowed[0] || [],
      penaltyByUser: penaltyByUser[0] || [],
    });
  } finally {
    if (connection) connection.release();
  }
});
// Clean up any remaining text after the module.exports that would be invalid
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
  cleanupOldData,
  getAdminReport
};
