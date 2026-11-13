const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updateAvatar,
  uploadProfileImage,
  addSkill,
  removeSkill,
  getActivities,
  getStudents,
  getPublicProfile,
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/me', protect, getProfile);
router.put('/me', protect, updateProfile);
router.put('/me/avatar', protect, updateAvatar);
router.post('/me/profile-image', protect, upload.single('avatar'), uploadProfileImage);
router.post('/me/skills', protect, addSkill);
router.delete('/me/skills/:skillId', protect, removeSkill);
router.get('/me/activities', protect, getActivities);
router.get('/recommendations', protect, getStudents);
router.get('/search', protect, getStudents);
router.get('/filter', protect, getStudents);
router.get('/', protect, getStudents);
router.get('/:id', protect, getPublicProfile);

module.exports = router;

