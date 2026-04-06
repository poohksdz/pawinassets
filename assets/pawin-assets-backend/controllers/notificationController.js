const asyncHandler = require('../middleware/asyncHandler.js');
const connectToDatabase = require('../config/db.js');

const safeQuery = async (conn, sql, params = []) => {
  try {
    return await conn.query(sql, params);
  } catch (err) {
    // If table doesn't exist, return empty
    if (err.message.includes('exist') || err.message.includes('Unknown')) {
      return [[]];
    }
    throw err;
  }
};

const getMyNotifications = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  try {
    const [notifications] = await safeQuery(connection,
      `SELECT id, title, message, is_read, created_at
       FROM tbl_notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.user._id]
    );
    res.json(notifications[0] || []);
  } finally {
    if (connection) connection.release();
  }
});

const markAsRead = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  try {
    const [rows] = await safeQuery(connection,
      'SELECT id FROM tbl_notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user._id]
    );

    if (!rows[0] || rows[0].length === 0) {
      res.status(404);
      throw new Error('ไม่พบการแจ้งเตือนนี้');
    }

    await connection.query(
      'UPDATE tbl_notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user._id]
    );

    res.json({ message: 'อ่านแล้ว' });
  } finally {
    if (connection) connection.release();
  }
});

const markAllAsRead = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  try {
    await connection.query(
      'UPDATE tbl_notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [req.user._id]
    );
    res.json({ message: 'อ่านทั้งหมดแล้ว' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
