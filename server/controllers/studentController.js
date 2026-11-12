const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Skill = require('../models/Skill');
const Activity = require('../models/Activity');
const { isConnected } = require('../config/db');
const { readDb, writeDb, generateId } = require('../config/localDb');

// Helper to calculate profile completion
const calculateProfilePercentage = (profile, user) => {
  let percentage = 25; // Base for user registration details (name, email, department, year)
  if (profile.aboutMe && profile.aboutMe.trim().length > 10) percentage += 20;
  if (profile.skills && profile.skills.length > 0) percentage += 20;
  if (profile.interests && profile.interests.length > 0) percentage += 15;
  if (
    profile.socialLinks &&
    (profile.socialLinks.github || profile.socialLinks.linkedin || profile.socialLinks.portfolio)
  ) {
    percentage += 10;
  }
  if (profile.avatar && profile.avatar.trim().length > 0) percentage += 10;
  return Math.min(percentage, 100);
};

// @desc    Get current student's profile
// @route   GET /api/students/me
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      let profile = await StudentProfile.findOne({ user: userId })
        .populate('user', 'name email department year role')
        .populate('skills');

      if (!profile) {
        profile = await StudentProfile.create({ user: userId, skills: [], interests: [] });
        profile = await profile.populate('user', 'name email department year role');
      }

      profile.calculateCompletion();
      await profile.save();

      return res.status(200).json({ success: true, profile });
    } else {
      const db = readDb();
      let profile = db.studentprofiles.find((p) => p.user === userId);
      const user = db.users.find((u) => u._id === userId || u.id === userId);

      if (!profile) {
        profile = {
          _id: generateId(),
          user: userId,
          collegeName: 'College Institute of Engineering & Technology',
          degree: 'Bachelor of Technology (B.Tech)',
          graduationYear: '2027',
          location: 'Campus / Hostel',
          aboutMe: '',
          avatar: '',
          skills: [],
          interests: [],
          socialLinks: { github: '', linkedin: '', portfolio: '' },
          completionPercentage: 25,
          createdAt: new Date().toISOString(),
        };
        db.studentprofiles.push(profile);
        writeDb(db);
      }

      // Populate skills
      const populatedSkills = (profile.skills || []).map((skId) => {
        const found = db.skills.find((s) => s._id === skId || s.name?.toLowerCase() === skId?.toString().toLowerCase());
        return found || { _id: skId, name: skId };
      });

      const fullProfile = {
        ...profile,
        skills: populatedSkills,
        user: user ? { _id: user._id, name: user.name, email: user.email, department: user.department, year: user.year } : null,
      };

      return res.status(200).json({ success: true, profile: fullProfile });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update current student profile & user info
// @route   PUT /api/students/me
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const {
      name,
      department,
      year,
      collegeName,
      degree,
      graduationYear,
      location,
      aboutMe,
      skills,
      interests,
      socialLinks,
    } = req.body;

    if (isConnected()) {
      // 1. Update User basic info
      const userUpdates = {};
      if (name) userUpdates.name = name.trim();
      if (department) userUpdates.department = department;
      if (year) userUpdates.year = year;

      if (Object.keys(userUpdates).length > 0) {
        await User.findByIdAndUpdate(userId, userUpdates, { new: true });
      }

      // 2. Find or create profile
      let profile = await StudentProfile.findOne({ user: userId });
      if (!profile) profile = new StudentProfile({ user: userId, skills: [], interests: [] });

      if (collegeName !== undefined) profile.collegeName = collegeName;
      if (degree !== undefined) profile.degree = degree;
      if (graduationYear !== undefined) profile.graduationYear = graduationYear;
      if (location !== undefined) profile.location = location;
      if (aboutMe !== undefined) profile.aboutMe = aboutMe;
      if (Array.isArray(interests)) profile.interests = interests;

      // Handle skills array update
      if (Array.isArray(skills)) {
        const skillIds = [];
        for (const item of skills) {
          const skillName = (typeof item === 'string' ? item : item.name || '').trim();
          if (skillName) {
            let skillDoc = await Skill.findOne({
              name: { $regex: new RegExp(`^${skillName}$`, 'i') },
            });
            if (!skillDoc) {
              skillDoc = await Skill.create({
                name: skillName,
                category: typeof item === 'object' && item.category ? item.category : 'Technical',
              });
            }
            if (!skillIds.some((id) => id.toString() === skillDoc._id.toString())) {
              skillIds.push(skillDoc._id);
            }
          }
        }
        profile.skills = skillIds;
      }

      if (socialLinks) {
        profile.socialLinks = {
          github: socialLinks.github !== undefined ? socialLinks.github : profile.socialLinks.github,
          linkedin: socialLinks.linkedin !== undefined ? socialLinks.linkedin : profile.socialLinks.linkedin,
          portfolio: socialLinks.portfolio !== undefined ? socialLinks.portfolio : profile.socialLinks.portfolio,
        };
      }

      profile.calculateCompletion();
      await profile.save();

      await Activity.create({
        user: userId,
        action: 'profile_updated',
        title: 'Profile Updated',
        description: 'Updated profile details, skills, and portfolio information',
      });

      const updatedProfile = await StudentProfile.findOne({ user: userId })
        .populate('user', 'name email department year role')
        .populate('skills');

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully!',
        profile: updatedProfile,
      });
    } else {
      const db = readDb();
      // Update user
      const userIndex = db.users.findIndex((u) => u._id === userId || u.id === userId);
      if (userIndex !== -1) {
        if (name) db.users[userIndex].name = name.trim();
        if (department) db.users[userIndex].department = department;
        if (year) db.users[userIndex].year = year;
      }

      // Update profile
      let profile = db.studentprofiles.find((p) => p.user === userId);
      if (!profile) {
        profile = {
          _id: generateId(),
          user: userId,
          skills: [],
          interests: [],
          socialLinks: { github: '', linkedin: '', portfolio: '' },
          createdAt: new Date().toISOString(),
        };
        db.studentprofiles.push(profile);
      }

      if (collegeName !== undefined) profile.collegeName = collegeName;
      if (degree !== undefined) profile.degree = degree;
      if (graduationYear !== undefined) profile.graduationYear = graduationYear;
      if (location !== undefined) profile.location = location;
      if (aboutMe !== undefined) profile.aboutMe = aboutMe;
      if (Array.isArray(interests)) profile.interests = interests;

      // Handle skills array update in localDb
      if (Array.isArray(skills)) {
        const skillIds = [];
        for (const item of skills) {
          const skillName = (typeof item === 'string' ? item : item.name || '').trim();
          if (skillName) {
            let skillDoc = db.skills.find(
              (s) => s.name?.toLowerCase() === skillName.toLowerCase()
            );
            if (!skillDoc) {
              skillDoc = {
                _id: generateId(),
                name: skillName,
                category: typeof item === 'object' && item.category ? item.category : 'Technical',
              };
              db.skills.push(skillDoc);
            }
            if (!skillIds.includes(skillDoc._id)) {
              skillIds.push(skillDoc._id);
            }
          }
        }
        profile.skills = skillIds;
      }

      if (socialLinks) {
        profile.socialLinks = {
          github: socialLinks.github !== undefined ? socialLinks.github : profile.socialLinks.github,
          linkedin: socialLinks.linkedin !== undefined ? socialLinks.linkedin : profile.socialLinks.linkedin,
          portfolio: socialLinks.portfolio !== undefined ? socialLinks.portfolio : profile.socialLinks.portfolio,
        };
      }

      profile.completionPercentage = calculateProfilePercentage(profile, db.users[userIndex]);

      db.activities.push({
        _id: generateId(),
        user: userId,
        action: 'profile_updated',
        title: 'Profile Updated',
        description: 'Updated profile details, skills, and portfolio information',
        createdAt: new Date().toISOString(),
      });

      writeDb(db);

      const populatedSkills = (profile.skills || []).map((skId) =>
        db.skills.find((s) => s._id === skId || s.name === skId) || { _id: skId, name: skId }
      );

      const fullProfile = {
        ...profile,
        skills: populatedSkills,
        user: db.users[userIndex] ? {
          _id: db.users[userIndex]._id,
          name: db.users[userIndex].name,
          email: db.users[userIndex].email,
          department: db.users[userIndex].department,
          year: db.users[userIndex].year,
        } : null,
      };

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully!',
        profile: fullProfile,
      });
    }
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

    const userId = req.user._id || req.user.id;
    const avatarUrl = `/uploads/${req.file.filename}`;

    if (isConnected()) {
      let profile = await StudentProfile.findOne({ user: userId });
      if (!profile) profile = new StudentProfile({ user: userId, skills: [], interests: [] });

      profile.avatar = avatarUrl;
      profile.calculateCompletion();
      await profile.save();

      await Activity.create({
        user: userId,
        action: 'avatar_updated',
        title: 'Profile Picture Updated',
        description: 'Uploaded a new university profile photo',
      });

      return res.status(200).json({
        success: true,
        message: 'Profile photograph uploaded successfully!',
        avatar: avatarUrl,
        completionPercentage: profile.completionPercentage,
      });
    } else {
      const db = readDb();
      let profile = db.studentprofiles.find((p) => p.user === userId);
      if (!profile) {
        profile = { _id: generateId(), user: userId, skills: [], interests: [], socialLinks: {} };
        db.studentprofiles.push(profile);
      }

      profile.avatar = avatarUrl;
      profile.completionPercentage = calculateProfilePercentage(profile);

      db.activities.push({
        _id: generateId(),
        user: userId,
        action: 'avatar_updated',
        title: 'Profile Picture Updated',
        description: 'Uploaded a new university profile photo',
        createdAt: new Date().toISOString(),
      });

      writeDb(db);

      return res.status(200).json({
        success: true,
        message: 'Profile photograph uploaded successfully!',
        avatar: avatarUrl,
        completionPercentage: profile.completionPercentage,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all available skills
// @route   GET /api/skills
// @access  Public
exports.getAllSkills = async (req, res, next) => {
  try {
    if (isConnected()) {
      const skills = await Skill.find().sort({ name: 1 });
      return res.status(200).json({ success: true, count: skills.length, skills });
    } else {
      const db = readDb();
      return res.status(200).json({
        success: true,
        count: (db.skills || []).length,
        skills: db.skills || [],
      });
    }
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
      return res.status(400).json({ success: false, message: 'Skill name is required' });
    }

    const trimmedName = skillName.trim();
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      let skill = await Skill.findOne({
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
      });

      if (!skill) {
        skill = await Skill.create({
          name: trimmedName,
          category: category || 'Technical',
        });
      }

      let profile = await StudentProfile.findOne({ user: userId });
      if (!profile) profile = new StudentProfile({ user: userId, skills: [], interests: [] });

      const alreadyExists = (profile.skills || []).some(
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

      await Activity.create({
        user: userId,
        action: 'skill_added',
        title: 'Added Technical Skill',
        description: `Added "${skill.name}" to technical skills list`,
      });

      const updatedProfile = await StudentProfile.findOne({ user: userId })
        .populate('user', 'name email department year role')
        .populate('skills');

      return res.status(200).json({
        success: true,
        message: `Skill "${skill.name}" added successfully!`,
        skills: updatedProfile.skills,
        completionPercentage: updatedProfile.completionPercentage,
      });
    } else {
      const db = readDb();
      let skill = db.skills.find(
        (s) => s.name?.toLowerCase() === trimmedName.toLowerCase()
      );

      if (!skill) {
        skill = {
          _id: generateId(),
          name: trimmedName,
          category: category || 'Technical',
        };
        db.skills.push(skill);
      }

      let profile = db.studentprofiles.find((p) => p.user === userId);
      if (!profile) {
        profile = { _id: generateId(), user: userId, skills: [], interests: [], socialLinks: {} };
        db.studentprofiles.push(profile);
      }

      if (!profile.skills) profile.skills = [];

      const alreadyExists = profile.skills.some(
        (s) => s === skill._id || s._id === skill._id || s.toLowerCase?.() === skill.name.toLowerCase()
      );

      if (alreadyExists) {
        return res.status(400).json({
          success: false,
          message: `The skill "${skill.name}" is already in your profile`,
        });
      }

      profile.skills.push(skill._id);
      profile.completionPercentage = calculateProfilePercentage(profile);

      db.activities.push({
        _id: generateId(),
        user: userId,
        action: 'skill_added',
        title: 'Added Technical Skill',
        description: `Added "${skill.name}" to technical skills list`,
        createdAt: new Date().toISOString(),
      });

      writeDb(db);

      const populatedSkills = profile.skills.map(
        (skId) => db.skills.find((s) => s._id === skId || s.name === skId) || { _id: skId, name: skId }
      );

      return res.status(200).json({
        success: true,
        message: `Skill "${skill.name}" added successfully!`,
        skills: populatedSkills,
        completionPercentage: profile.completionPercentage,
      });
    }
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
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      let profile = await StudentProfile.findOne({ user: userId });
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }

      const skillToRemove = await Skill.findById(skillId);
      profile.skills = (profile.skills || []).filter(
        (s) => s.toString() !== skillId.toString()
      );

      profile.calculateCompletion();
      await profile.save();

      if (skillToRemove) {
        await Activity.create({
          user: userId,
          action: 'skill_removed',
          title: 'Removed Skill',
          description: `Removed "${skillToRemove.name}" from skills profile`,
        });
      }

      const updatedProfile = await StudentProfile.findOne({ user: userId })
        .populate('user', 'name email department year role')
        .populate('skills');

      return res.status(200).json({
        success: true,
        message: 'Skill removed successfully',
        skills: updatedProfile.skills,
        completionPercentage: updatedProfile.completionPercentage,
      });
    } else {
      const db = readDb();
      let profile = db.studentprofiles.find((p) => p.user === userId);
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }

      const skillToRemove = db.skills.find((s) => s._id === skillId || s.name === skillId);
      profile.skills = (profile.skills || []).filter(
        (s) => s !== skillId && s._id !== skillId && s !== skillToRemove?.name
      );

      profile.completionPercentage = calculateProfilePercentage(profile);

      if (skillToRemove) {
        db.activities.push({
          _id: generateId(),
          user: userId,
          action: 'skill_removed',
          title: 'Removed Skill',
          description: `Removed "${skillToRemove.name}" from skills profile`,
          createdAt: new Date().toISOString(),
        });
      }

      writeDb(db);

      const populatedSkills = (profile.skills || []).map(
        (skId) => db.skills.find((s) => s._id === skId || s.name === skId) || { _id: skId, name: skId }
      );

      return res.status(200).json({
        success: true,
        message: 'Skill removed successfully',
        skills: populatedSkills,
        completionPercentage: profile.completionPercentage,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get student's recent activities
// @route   GET /api/students/me/activities
// @access  Private
exports.getActivities = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      const activities = await Activity.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(10);
      return res.status(200).json({ success: true, count: activities.length, activities });
    } else {
      const db = readDb();
      const activities = (db.activities || [])
        .filter((a) => a.user === userId)
        .reverse()
        .slice(0, 10);
      return res.status(200).json({ success: true, count: activities.length, activities });
    }
  } catch (error) {
    next(error);
  }
};
