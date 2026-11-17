const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const controller = require('../controllers/settingsController');
const router = express.Router();
router.use(protect);
router.get('/', controller.getSettings);
router.put('/', controller.updateSettings);
router.put('/password', controller.changePassword);
module.exports = router;
