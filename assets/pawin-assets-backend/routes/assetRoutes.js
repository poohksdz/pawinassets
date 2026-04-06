const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');

// 🚀 1. เพิ่มการนำเข้าฟังก์ชันต่างๆ เข้ามาด้วย
const { getAssets, createAsset, updateAsset, deleteAsset, createBarcodeAsset, getCategories } = require('../controllers/assetController');

// Route สำหรับดึงข้อมูล (GET) — ต้อง login
router.get('/', protect, getAssets);

// Route สำหรับให้ดึงรายชื่อหมวดหมู่ (GET) — ต้อง login
router.get('/categories', protect, getCategories);

// Route สำหรับเพิ่มสินค้าระบบบาร์โค้ด (POST) — admin เท่านั้น
router.post('/barcode', protect, admin, createBarcodeAsset);

// Route สำหรับให้ Admin ส่งข้อมูลมาบันทึก (POST) — admin เท่านั้น
router.post('/', protect, admin, createAsset);

// 🚀 2. เพิ่ม Route สำหรับแก้ไข (PUT) และ ลบ (DELETE) — admin เท่านั้น
router.put('/:id', protect, admin, updateAsset);
router.delete('/:id', protect, admin, deleteAsset);

module.exports = router;