// controllers/productController.js
const asyncHandler = require('../middleware/asyncHandler.js');
const connectToDatabase = require('../config/db.js');

// @desc    Get all products
// @route   GET /api/products
const getProducts = asyncHandler(async (req, res) => {
  const connection = await connectToDatabase();
  
  // เปลี่ยนชื่อตารางให้ตรงกับในฐานข้อมูลของคุณ (เช่น products หรือ assets)
  const [products] = await connection.query('SELECT * FROM products');
  
  res.json(products);
});

module.exports = { getProducts };