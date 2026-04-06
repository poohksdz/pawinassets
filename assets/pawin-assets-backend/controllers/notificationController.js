const asyncHandler = require('../middleware/asyncHandler.js');
const connectToDatabase = require('../config/db.js');

// @desc    ดึงการแจ้งเตือนของฉัน (ใช้ protect middleware แทนการถอด JWT เอง)
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  try {
    console.log('Fetching notifications for user:', req.user ? req.user._id : 'undefined');
    const [notifications] = await connection.query(
      `SELECT id, title, message, is_read, created_at 
       FROM tbl_notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 100`,
      [req.user._id]
    );
    res.json(notifications);
  } catch (e) {
    console.error('Error fetching notifications:', e.message);
    throw e;
  } finally {
    if (connection) connection.release();
  }
});

// @desc    อ่านการแจ้งเตือน (เปลี่ยน is_read เป็น 1)
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  try {
    // ตรวจสอบว่า notification นี้เป็นของ user คนนี้จริงๆ ป้องกันคนอื่นมาเปลี่ยนสถานะ
    const [rows] = await connection.query(
      'SELECT id FROM tbl_notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user._id]
    );

    if (rows.length === 0) {
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

// @desc    อ่านทั้งหมดแล้ว (Mark all as read)
// @route   PUT /api/notifications/read-all
// @access  Private
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