// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { authUser } = require('../controllers/userController');

// 🚀 เพิ่มบรรทัดนี้เพื่อทดสอบ (Test Route)
router.get('/test', (req, res) => res.send('User Route is Working!'));

router.post('/login', authUser);

module.exports = router;