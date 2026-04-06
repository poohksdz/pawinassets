// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();

// 🚀 นำเข้าฟังก์ชันจาก Controller
const {
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
} = require('../controllers/adminController');

// นำเข้า Middleware ตรวจสอบสิทธิ์ (ต้องล็อกอินและเป็น Admin เท่านั้น)
const { protect, admin } = require('../middleware/authMiddleware');

// --- 🌐 กำหนดเส้นทาง API (Routes) ---

// 📊 จัดการสถิติและภาพรวม
router.get('/stats', protect, admin, getAdminStats);

// 👥 จัดการข้อมูลพนักงาน
router.get('/users', protect, admin, getAllUsers);
router.put('/update-credit', protect, admin, updateUserCredit);

// 📦 จัดการข้อมูลอุปกรณ์
router.put('/product-price', protect, admin, updateProductPrice);
router.put('/product-quantity', protect, admin, updateProductQuantity);

// 🚀 เส้นทางสำหรับตรวจสอบสถานะการยืม (Tactical View)
router.get('/active-borrows', protect, admin, getAllActiveBorrows);
router.get('/user-borrows/:id', protect, admin, getUserBorrowDetails);

// 🚀 เส้นทางสำหรับ "อนุมัติรับของคืนและบวกสต๊อก"
router.put('/approve-return', protect, admin, approveReturn);

// 🚀 ฟังก์ชัน Admin ใหม่
router.get('/transactions', protect, admin, getTransactionHistory);     // ดูประวัติธุรกรรม
router.post('/force-return', protect, admin, forceReturn);              // บังคับคืนอุปกรณ์
router.post('/adjust-credit', protect, admin, adjustCredit);            // ปรับเครดิตพร้อม log
router.delete('/cleanup', protect, admin, cleanupOldData);              // เคลียร์ข้อมูลเก่ากว่า 2 เดือน

module.exports = router;