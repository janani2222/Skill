const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Skill = require('../models/Skill');
const Activity = require('../models/Activity');

// @desc    Get dashboard statistics & overview for logged in student
// @route   GET /api/dashboard
// @access  Private
exports.getDashboardData = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    let profile = await StudentProfile.findOne({ user: req.user.id }).populate('skills');

    if (!profile) {
      profile = await StudentProfile.create({ user: req.user.id });
    }

    profile.calculateCompletion();
    await profile.save();

    const recentActivities = await Activity.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5);

    const stats = {
      totalSkills: profile.skills ? profile.skills.length : 0,
      projectsJoined: 0, // Phase 1 default
      profileCompletion: profile.completionPercentage || 25,
      accountStatus: 'Active Student',
    };

    res.status(200).json({
      success: true,
      user,
      profile,
      stats,
      activities: recentActivities,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get platform-wide statistics for Landing Page (public)
// @route   GET /api/statistics
// @access  Public
exports.getPlatformStats = async (req, res, next) => {
  try {
    const studentsRegistered = await User.countDocuments();
    const skillsListed = await Skill.countDocuments();
    const departments = await User.distinct('department');
    const departmentsConnected = departments ? departments.length : 0;
    const projectsCreated = 0; // Phase 1 strictly

    res.status(200).json({
      success: true,
      stats: {
        studentsRegistered,
        projectsCreated,
        skillsListed,
        departmentsConnected,
      },
    });
  } catch (error) {
    next(error);
  }
};
