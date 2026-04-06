const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getProfile, updateProfile, changePassword } = require('../controllers/profileController');

const router = express.Router();

router.get('/me', protect, getProfile);
router.put('/me', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// For backward compatibility with frontend calling /api/profile/me
// Also register under /profile so we can use app.use('/api/profile', profileRoutes)
module.exports = router;
