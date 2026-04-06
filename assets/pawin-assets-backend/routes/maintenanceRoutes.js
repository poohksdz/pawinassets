const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getMaintenanceLogs,
  createMaintenanceLog,
  updateMaintenanceLog,
  deleteMaintenanceLog,
} = require('../controllers/maintenanceController');

const router = express.Router();

router.get('/', protect, getMaintenanceLogs);
router.post('/', protect, admin, createMaintenanceLog);
router.put('/:id', protect, admin, updateMaintenanceLog);
router.delete('/:id', protect, admin, deleteMaintenanceLog);

module.exports = router;
