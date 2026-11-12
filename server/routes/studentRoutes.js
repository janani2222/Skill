const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  uploadProfileImage,
  addSkill,
  removeSkill,
  getActivities,
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/me', protect, getProfile);
router.put('/me', protect, updateProfile);
router.post('/me/profile-image', protect, upload.single('avatar'), uploadProfileImage);
router.post('/me/skills', protect, addSkill);
router.delete('/me/skills/:skillId', protect, removeSkill);
router.get('/me/activities', protect, getActivities);

module.exports = router;

