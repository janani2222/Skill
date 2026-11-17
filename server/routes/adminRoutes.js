const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');
const c = require('../controllers/adminController');

router.use(protect, admin);

// 1. Overview & Statistics
router.get('/overview', c.getOverview);

// 2. Student Management
router.get('/students', c.getStudents);
router.patch('/students/:id/active', c.toggleStudentActive);
router.delete('/students/:id', c.deleteStudent);

// 3. Projects Management
router.get('/projects', c.getProjects);
router.delete('/projects/:id', c.deleteProject);

// 4. Workshops Management
router.get('/workshops', c.getWorkshops);
router.post('/workshops', c.createWorkshop);
router.put('/workshops/:id', c.updateWorkshop);
router.delete('/workshops/:id', c.deleteWorkshop);

// 5. Communities Management
router.get('/communities', c.getCommunities);
router.post('/communities', c.createCommunity);
router.delete('/communities/:id', c.deleteCommunity);

// 6. Join Requests
router.get('/join-requests', c.getJoinRequests);

// 7. Announcements
router.get('/announcements', c.getAnnouncements);
router.post('/announcements', c.createAnnouncement);
router.delete('/announcements/:id', c.deleteAnnouncement);

// 8. Reports & Analytics
router.get('/reports', c.getReports);

// 9. Audit Logs & Settings
router.get('/audit-logs', c.getAuditLogs);
router.put('/password', c.changePassword);

module.exports = router;
