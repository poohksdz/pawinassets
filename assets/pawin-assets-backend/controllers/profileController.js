const connectToDatabase = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const safeQuery = async (conn, sql, params = []) => {
  try { return await conn.query(sql, params); }
  catch (err) { console.warn('Profile query fallback:', err.message); return [[]]; }
};

const getProfile = async (req, res) => {
  let connection;
  try {
    connection = await connectToDatabase();
    const userId = req.user._id;

    // Get user details including new columns
    const [rows] = await safeQuery(connection,
      `SELECT u._id, u.name, u.email, u.penalty,
              u.department, u.location, u.isAdmin
       FROM users u WHERE u._id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];

    // Count active borrows
    const [activeBorrows] = await safeQuery(connection,
      `SELECT COUNT(*) as cnt FROM tbl_borrow WHERE user_id = ? AND status = 'active'`,
      [userId]
    );

    // Count total borrows
    const [totalBorrows] = await safeQuery(connection,
      `SELECT COUNT(*) as cnt FROM tbl_borrow WHERE user_id = ?`,
      [userId]
    );

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      department: user.department || '',
      location: user.location || '',
      penalty: Number(user.penalty || 0),
      isAdmin: !!user.isAdmin,
      activeBorrows: activeBorrows[0]?.cnt || 0,
      totalBorrows: totalBorrows[0]?.cnt || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (connection) connection.release();
  }
};

const updateProfile = async (req, res) => {
  let connection;
  try {
    connection = await connectToDatabase();
    const { name, department, location } = req.body;
    const userId = req.user._id;

    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (department !== undefined) { updates.push('department = ?'); values.push(department); }
    if (location !== undefined) { updates.push('location = ?'); values.push(location); }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    // Check if columns exist first
    const [cols] = await safeQuery(connection,
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME IN ('department', 'location')`
    );
    const existingCols = cols.map(c => c.COLUMN_NAME);

    // Only update columns that exist
    const validUpdates = [];
    const validValues = [];
    updates.forEach((u, i) => {
      const colName = u.split(' ')[0];
      if (colName === 'name' || existingCols.includes(colName)) {
        validUpdates.push(u);
        validValues.push(values[i]);
      }
    });

    if (validUpdates.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    validValues.push(userId);
    const sql = `UPDATE users SET ${validUpdates.join(', ')} WHERE _id = ?`;
    await connection.query(sql, validValues);

    const [updated] = await safeQuery(connection,
      `SELECT name, department, location FROM users WHERE _id = ?`,
      [userId]
    );

    res.json(updated[0] || {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (connection) connection.release();
  }
};

const changePassword = async (req, res) => {
  let connection;
  try {
    connection = await connectToDatabase();
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'กรุณากรอกรหัสผ่านให้ครบ' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    const userId = req.user._id;
    const [rows] = await safeQuery(connection,
      `SELECT password FROM users WHERE _id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) {
      return res.status(401).json({ message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await connection.query('UPDATE users SET password = ? WHERE _id = ?', [hashedPassword, userId]);

    res.json({ message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { getProfile, updateProfile, changePassword };
