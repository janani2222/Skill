const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Skill = require('../models/Skill');
const Activity = require('../models/Activity');

// @desc    Get current student's profile
// @route   GET /api/students/me
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    let profile = await StudentProfile.findOne({ user: req.user.id })
      .populate('user', 'name email department year role')
      .populate('skills');

    if (!profile) {
      // Create one if not found
      profile = await StudentProfile.create({
        user: req.user.id,
      });
      profile = await profile.populate('user', 'name email department year role');
    }

    profile.calculateCompletion();
    await profile.save();

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current student profile & user info
// @route   PUT /api/students/me
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const {
      name,
      department,
      year,
      collegeName,
      degree,
      graduationYear,
      location,
      aboutMe,
      interests,
      socialLinks,
    } = req.body;

    // Update User model fields if provided
    const userUpdates = {};
    if (name) userUpdates.name = name.trim();
    if (department) userUpdates.department = department;
    if (year) userUpdates.year = year;

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(req.user.id, userUpdates, {
        new: true,
        runValidators: true,
      });
    }

    // Find and update StudentProfile
    let profile = await StudentProfile.findOne({ user: req.user.id });
    if (!profile) {
      profile = new StudentProfile({ user: req.user.id });
    }

    if (collegeName !== undefined) profile.collegeName = collegeName;
    if (degree !== undefined) profile.degree = degree;
    if (graduationYear !== undefined) profile.graduationYear = graduationYear;
    if (location !== undefined) profile.location = location;
    if (aboutMe !== undefined) profile.aboutMe = aboutMe;
    if (Array.isArray(interests)) profile.interests = interests;
    if (socialLinks) {
      profile.socialLinks = {
        github: socialLinks.github !== undefined ? socialLinks.github : profile.socialLinks.github,
        linkedin: socialLinks.linkedin !== undefined ? socialLinks.linkedin : profile.socialLinks.linkedin,
        portfolio: socialLinks.portfolio !== undefined ? socialLinks.portfolio : profile.socialLinks.portfolio,
      };
    }

    // Recalculate completion
    profile.calculateCompletion();
    await profile.save();

    // Log Activity
    await Activity.create({
      user: req.user.id,
      action: 'profile_updated',
      title: 'Profile Updated',
      description: 'Updated profile details and portfolio information',
    });

    const updatedProfile = await StudentProfile.findOne({ user: req.user.id })
      .populate('user', 'name email department year role')
      .populate('skills');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload profile picture
// @route   POST /api/students/me/profile-image
// @access  Private
exports.uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please choose an image file to upload.',
      });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;

    let profile = await StudentProfile.findOne({ user: req.user.id });
    if (!profile) {
      profile = new StudentProfile({ user: req.user.id });
    }

    profile.avatar = avatarUrl;
    profile.calculateCompletion();
    await profile.save();

    // Log activity
    await Activity.create({
      user: req.user.id,
      action: 'avatar_updated',
      title: 'Profile Picture Updated',
      description: 'Uploaded a new university profile photo',
    });

    res.status(200).json({
      success: true,
      message: 'Profile photograph uploaded successfully!',
      avatar: avatarUrl,
      completionPercentage: profile.completionPercentage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all available skills
// @route   GET /api/skills
// @access  Public
exports.getAllSkills = async (req, res, next) => {
  try {
    let skills = await Skill.find().sort({ name: 1 });

    // Seed default common skills if DB is empty
    if (skills.length === 0) {
      const defaultSkills = [
        { name: 'React.js', category: 'Frontend' },
        { name: 'Node.js', category: 'Backend' },
        { name: 'Express.js', category: 'Backend' },
        { name: 'MongoDB', category: 'Database' },
        { name: 'JavaScript', category: 'Language' },
        { name: 'Python', category: 'Language' },
        { name: 'Java', category: 'Language' },
        { name: 'C++', category: 'Language' },
        { name: 'HTML5', category: 'Frontend' },
        { name: 'CSS3', category: 'Frontend' },
        { name: 'Data Structures', category: 'Computer Science' },
        { name: 'Git & GitHub', category: 'DevOps' },
        { name: 'Tailwind CSS', category: 'Frontend' },
        { name: 'SQL', category: 'Database' },
        { name: 'Machine Learning', category: 'AI/Data' },
        { name: 'Figma', category: 'UI/UX' },
      ];
      skills = await Skill.insertMany(defaultSkills);
    }

    res.status(200).json({
      success: true,
      count: skills.length,
      skills,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a skill to student's profile
// @route   POST /api/students/me/skills
// @access  Private
exports.addSkill = async (req, res, next) => {
  try {
    const { skillName, category } = req.body;

    if (!skillName || !skillName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Skill name is required',
      });
    }

    const trimmedName = skillName.trim();

    // Find or create skill in Skill collection
    let skill = await Skill.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    });

    if (!skill) {
      skill = await Skill.create({
        name: trimmedName,
        category: category || 'Technical',
      });
    }

    // Get student profile
    let profile = await StudentProfile.findOne({ user: req.user.id });
    if (!profile) {
      profile = new StudentProfile({ user: req.user.id });
    }

    // Check duplicate
    const alreadyExists = profile.skills.some(
      (s) => s.toString() === skill._id.toString()
    );

    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        message: `The skill "${skill.name}" is already in your profile`,
      });
    }

    profile.skills.push(skill._id);
    profile.calculateCompletion();
    await profile.save();

    // Log Activity
    await Activity.create({
      user: req.user.id,
      action: 'skill_added',
      title: 'Added Technical Skill',
      description: `Added "${skill.name}" to technical skills list`,
    });

    const updatedProfile = await StudentProfile.findOne({ user: req.user.id })
      .populate('user', 'name email department year role')
      .populate('skills');

    res.status(200).json({
      success: true,
      message: `Skill "${skill.name}" added successfully!`,
      skills: updatedProfile.skills,
      completionPercentage: updatedProfile.completionPercentage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a skill from student's profile
// @route   DELETE /api/students/me/skills/:skillId
// @access  Private
exports.removeSkill = async (req, res, next) => {
  try {
    const { skillId } = req.params;

    let profile = await StudentProfile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    const skillToRemove = await Skill.findById(skillId);

    profile.skills = profile.skills.filter(
      (s) => s.toString() !== skillId.toString()
    );

    profile.calculateCompletion();
    await profile.save();

    // Log activity
    if (skillToRemove) {
      await Activity.create({
        user: req.user.id,
        action: 'skill_removed',
        title: 'Removed Skill',
        description: `Removed "${skillToRemove.name}" from skills profile`,
      });
    }

    const updatedProfile = await StudentProfile.findOne({ user: req.user.id })
      .populate('user', 'name email department year role')
      .populate('skills');

    res.status(200).json({
      success: true,
      message: 'Skill removed successfully',
      skills: updatedProfile.skills,
      completionPercentage: updatedProfile.completionPercentage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student's recent activities
// @route   GET /api/students/me/activities
// @access  Private
exports.getActivities = async (req, res, next) => {
  try {
    const activities = await Activity.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    next(error);
  }
};
