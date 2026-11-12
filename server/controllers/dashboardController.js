const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Skill = require('../models/Skill');
const Activity = require('../models/Activity');
const { isConnected } = require('../config/db');
const { readDb } = require('../config/localDb');

// @desc    Get dashboard statistics & overview for logged in student
// @route   GET /api/dashboard
// @access  Private
exports.getDashboardData = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      const user = await User.findById(userId);
      let profile = await StudentProfile.findOne({ user: userId }).populate('skills');

      if (!profile) {
        profile = await StudentProfile.create({ user: userId });
      }

      profile.calculateCompletion();
      await profile.save();

      const recentActivities = await Activity.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5);

      const stats = {
        totalSkills: profile.skills ? profile.skills.length : 0,
        projectsJoined: 0,
        profileCompletion: profile.completionPercentage || 25,
        accountStatus: 'Active Student',
      };

      return res.status(200).json({
        success: true,
        user,
        profile,
        stats,
        activities: recentActivities,
      });
    } else {
      const db = readDb();
      const user = db.users.find((u) => u._id === userId || u.id === userId);
      let profile = db.studentprofiles.find((p) => p.user === userId);

      if (profile) {
        const populatedSkills = (profile.skills || []).map((skId) =>
          db.skills.find((s) => s._id === skId || s.name === skId) || { _id: skId, name: skId }
        );
        profile = { ...profile, skills: populatedSkills };
      }

      const recentActivities = (db.activities || [])
        .filter((a) => a.user === userId)
        .reverse()
        .slice(0, 5);

      const stats = {
        totalSkills: profile?.skills ? profile.skills.length : 0,
        projectsJoined: 0,
        profileCompletion: profile?.completionPercentage || 25,
        accountStatus: 'Active Student',
      };

      const { password, ...safeUser } = user || {};

      return res.status(200).json({
        success: true,
        user: safeUser,
        profile,
        stats,
        activities: recentActivities,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get platform-wide statistics for Landing Page (public)
// @route   GET /api/statistics
// @access  Public
exports.getPlatformStats = async (req, res, next) => {
  try {
    if (isConnected()) {
      const studentsRegistered = await User.countDocuments();
      const skillsListed = await Skill.countDocuments();
      const departments = await User.distinct('department');
      const departmentsConnected = departments ? departments.length : 0;
      const projectsCreated = 0;

      return res.status(200).json({
        success: true,
        stats: {
          studentsRegistered,
          projectsCreated,
          skillsListed,
          departmentsConnected,
        },
      });
    } else {
      const db = readDb();
      const studentsRegistered = db.users.length;
      const skillsListed = db.skills.length;
      const departments = [...new Set(db.users.map((u) => u.department).filter(Boolean))];
      const departmentsConnected = departments.length;
      const projectsCreated = 0;

      return res.status(200).json({
        success: true,
        stats: {
          studentsRegistered,
          projectsCreated,
          skillsListed,
          departmentsConnected,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};
