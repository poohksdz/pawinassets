// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler.js');
const connectToDatabase = require('../config/db.js');

// 🛡️ 1. protect: ตรวจสอบว่ามีการ Login และมี Token ที่ถูกต้องไหม
const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const connection = await connectToDatabase();
      try {
        const [rows] = await connection.query('SELECT _id, name, email, isAdmin FROM users WHERE _id = ?', [decoded.id]);

        if (rows.length === 0) {
          res.status(401);
          throw new Error('ไม่พบข้อมูลผู้ใช้งานในระบบ');
        }

        req.user = rows[0];
        next();
      } finally {
        if (connection) connection.release(); // ✅ คืนท่อลงสระ (Pool)
      }
    } catch (error) {
      // 🛑 ไม่ต้องปริ้นท์ error.message ลง console เพื่อไม่ให้ผู้ใช้เข้าใจผิดว่าเป็นบั๊กของระบบ
      res.status(401);
      throw new Error('สิทธิ์การเข้าถึงไม่ถูกต้อง Token ผิดพลาด');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('ไม่พบสิทธิ์การเข้าถึง โปรด Login');
  }
});

// 🛡️ 2. admin: ตรวจสอบว่าเป็น Admin จริงหรือไม่
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401);
    throw new Error('คุณไม่มีสิทธิ์เข้าถึงส่วนของแอดมิน');
  }
};

module.exports = { protect, admin };