// src/routes/borrowRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, admin } = require('../middleware/authMiddleware');

// 1. ดึงฟังก์ชันมาจาก Controller
const {
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
} = require('../controllers/borrowController');

// 2. ตั้งค่า Multer สำหรับอัปโหลดรูปตอนคืนของ
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, 'return-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// --- 📦 ส่วนของการดึงข้อมูล (GET) ---
router.get('/pending', protect, admin, getAllPendingReturns);                 // Admin: ดูรอคืน
router.get('/pending-borrows', protect, admin, getAllPendingBorrows);         // Admin: ดูรอเบิก
router.get('/my-history', protect, getMyBorrowHistory);                       // User: ดูประวัติของตัวเอง

// --- 📦 ส่วนของการสร้าง/แก้ไข (POST/PUT) ---
router.post('/', protect, createBorrowRecord);                                // User: ส่งคำขอเบิก
router.post('/:id/return', protect, upload.single('return_image'), requestReturn); // User: ส่งรูปคืนของตัวเอง

// Admin Action (Borrow)
router.put('/:id/approve-borrow', protect, admin, approveBorrow);             // Admin: อนุมัติเบิก
router.put('/:id/reject-borrow', protect, admin, rejectBorrow);               // Admin: ปฏิเสธเบิก
router.put('/:id/update-qty', protect, admin, updateBorrowQty);               // Admin: แก้ไขจำนวน

// Admin Action (Return)
router.put('/:id/approve', protect, admin, approveReturn);                    // Admin: อนุมัติคืน
router.put('/:id/reject', protect, admin, rejectReturn);                      // Admin: ปฏิเสธคืน

module.exports = router;