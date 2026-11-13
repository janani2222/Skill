const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { listProjects, getProject, createProject, updateProject, deleteProject, uploadMedia, deleteMedia, listPublicProjects, getPublicProject } = require('../controllers/projectController');

router.get('/public', listPublicProjects);
router.get('/public/:id', getPublicProject);
router.get('/', protect, listProjects);
router.get('/student/:studentId', protect, (req, res, next) => { req.query.studentId = req.params.studentId; listProjects(req, res, next); });
router.get('/:id', protect, getProject);
router.post('/', protect, createProject);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);
router.post('/:id/media', protect, upload.uploadProjectMedia.single('file'), uploadMedia);
router.delete('/:id/media/:mediaId', protect, deleteMedia);
module.exports = router;
