// utils/generateToken.js
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    console.error('❌ CRITICAL ERROR: JWT_SECRET is not defined in .env');
    throw new Error('JWT_SECRET is missing from configuration');
  }
  // สร้าง Token จาก ID และรหัสลับใน .env
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // ให้ Token มีอายุ 30 วัน
  });
};

module.exports = generateToken;