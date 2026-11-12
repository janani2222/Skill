const express = require('express');
const router = express.Router();
const {
  getDashboardData,
  getPlatformStats,
} = require('../controllers/dashboardController');
const { getAllSkills } = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, getDashboardData);
router.get('/statistics', getPlatformStats);
router.get('/skills', getAllSkills);

module.exports = router;

