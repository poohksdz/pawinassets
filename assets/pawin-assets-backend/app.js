// app.js (Backend)
const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const connectToDatabase = require('./config/db.js');
const socketIO = require('./socket');

dotenv.config();

// นำเข้า Routes
const userRoutes = require('./routes/userRoutes');
const assetRoutes = require('./routes/assetRoutes');
const borrowRoutes = require('./routes/borrowRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// 🛡️ Rate Limiting — ป้องกัน Brute Force Attack
const rateLimit = require('express-rate-limit');

// จำกัด Login: 10 ครั้งต่อ 15 นาที
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'ลองเข้าสู่ระบบมากเกินไป กรุณารอ 15 นาที' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/users/login', loginLimiter);

// จำกัด API ทั่วไป: 1000 ครั้งต่อ 15 นาที (ผ่อนผันสำหรับ SPA ที่เรียกหลาย endpoint พร้อมกัน)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: { message: 'คำขอมากเกินไป กรุณารอสักครู่' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// ---  ส่วนที่ต้องแก้เรื่องรูปภาพให้ตรงจุด  ---

// 1. ชี้ไปที่โฟลเดอร์ images ใน Frontend (รูปที่มีอยู่แล้ว)
const frontendImagesPath = path.resolve(__dirname, '..', 'pawin-assets-frontend', 'public', 'images');
app.use('/images', express.static(frontendImagesPath));

// 2. ชี้ไปที่โฟลเดอร์ uploads ใน Backend (รูปที่อัปโหลดใหม่)
const backendUploadsPath = path.resolve(__dirname, 'uploads');
app.use('/uploads', express.static(backendUploadsPath));

// 🛠️ ตรวจสอบ Path ใน Terminal ตอนรัน (เพื่อความชัวร์)
console.log(`📂 Images Location: ${frontendImagesPath}`);
console.log(`📂 Uploads Location: ${backendUploadsPath}`);

// ------------------------------------------

app.use('/api/users', userRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/borrow', borrowRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/ping', (req, res) => res.send('Backend Server is Ready! ✅'));

// Error Handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // 🛑 Print full error to console for debugging
  console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, err);

  res.status(statusCode).json({
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// Cron Job (แจ้งเตือน)
cron.schedule('0 8 * * *', async () => {
  let connection;
  try {
    connection = await connectToDatabase();
    // ... โค้ดแจ้งเตือนเดิม ...
  } finally {
    if (connection) connection.release();
  }
});

// 🚀 Cron Job: ลบข้อมูลเก่ากว่า 2 เดือน อัตโนมัติ (ทุกวันที่ 1 ของเดือน เวลา 00:00 น.)
cron.schedule('0 0 1 * *', async () => {
  let connection;
  try {
    connection = await connectToDatabase();
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const cutoffDate = twoMonthsAgo.toISOString().slice(0, 19).replace('T', ' ');

    // ลบประวัติการยืมที่คืนแล้ว (status = 'returned') เก่ากว่า 2 เดือน
    const [borrowResult] = await connection.query(
      `DELETE FROM tbl_borrow WHERE status = 'returned' AND return_date < ?`,
      [cutoffDate]
    );

    // ลบประวัติธุรกรรม (tbl_transactions) 
    // เฉพาะที่เกิดก่อน 2 เดือน และการยืมนั้นเสร็จสมบูรณ์แล้ว (คืนแล้ว/ลบไปแล้ว) หรือเป็นธุรกรรมที่ไม่มีการยืมประกอบ
    const [transResult] = await connection.query(
      `DELETE FROM tbl_transactions 
       WHERE created_at < ? 
         AND (
           borrow_id IS NULL 
           OR borrow_id NOT IN (SELECT id FROM tbl_borrow WHERE status != 'returned')
         )`,
      [cutoffDate]
    );

    console.log(`🧹 AUTO-CLEANUP [${new Date().toISOString()}]: Deleted ${borrowResult.affectedRows} old borrows, ${transResult.affectedRows} old transactions (before ${cutoffDate})`);
  } catch (err) {
    console.error('❌ AUTO-CLEANUP ERROR:', err.message);
  } finally {
    if (connection) connection.release();
  }
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
socketIO.init(server);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (Socket.io Ready)`);
});

// 🛑 Graceful Shutdown — ปิด server อย่างปลอดภัย
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('💤 Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('💤 Server closed.');
    process.exit(0);
  });
});