// src/config/db.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

// 🚀 สร้าง "สระน้ำเชื่อมต่อ" (Connection Pool)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pawin_tech',
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // SSL สำหรับ TiDB Cloud
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: true
  } : undefined,
  // TiDB ต้องใช้ timezone UTC
  timezone: '+00:00'
});

// ฟังก์ชันสำหรับดึง connection จาก pool (backward compatible กับโค้ดเดิม)
const connectToDatabase = async () => {
  return await pool.getConnection();
};

// ส่งออกทั้ง function (สำหรับโค้ดเดิม) และ pool object (สำหรับ cron job, shutdown ฯลฯ)
module.exports = connectToDatabase;
module.exports.pool = pool;
