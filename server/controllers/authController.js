const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Activity = require('../models/Activity');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { isConnected } = require('../config/db');
const { readDb, writeDb, generateId } = require('../config/localDb');

// Generate JWT token helper
const generateToken = (id, rememberMe = false) => {
  return jwt.sign(
    { id: id.toString() },
    process.env.JWT_SECRET || 'skillbridge_super_secret_jwt_key_2026_secure',
    {
      expiresIn: rememberMe ? '30d' : process.env.JWT_EXPIRE || '7d',
    }
  );
};

// Send token response with HTTP-only cookie and JSON data
const sendTokenResponse = (user, statusCode, res, rememberMe = false) => {
  const userId = user._id || user.id;
  const token = generateToken(userId, rememberMe);

  const cookieOptions = {
    expires: new Date(
      Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        id: userId,
        _id: userId,
        name: user.name,
        email: user.email,
        department: user.department,
        year: user.year,
        role: user.role || 'student',
      },
    });
};

// @desc    Register a new student
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, department, year } = req.body;

    // Validation
    if (!name || !email || !password || !department || !year) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if MongoDB is connected
    if (isConnected()) {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'A student with this college email is already registered.',
        });
      }

      const user = await User.create({
        name: name.trim(),
        email: cleanEmail,
        password,
        department,
        year,
      });

      // Initially empty skills and interests as required
      await StudentProfile.create({
        user: user._id,
        aboutMe: '',
        skills: [],
        interests: [],
        completionPercentage: 25,
      });

      await Activity.create({
        user: user._id,
        action: 'account_created',
        title: 'Joined SkillBridge',
        description: `Registered student account with ${user.department} (${user.year})`,
      });

      return sendTokenResponse(user, 201, res);
    } else {
      // Local persistent DB fallback
      const db = readDb();
      const existingUser = db.users.find((u) => u.email === cleanEmail);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'A student with this college email is already registered.',
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const userId = generateId();

      const newUser = {
        _id: userId,
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        department,
        year,
        role: 'student',
        createdAt: new Date().toISOString(),
      };

      // Completely empty skills and interests initially
      const newProfile = {
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
        socialLinks: {
          github: '',
          linkedin: '',
          portfolio: '',
        },
        completionPercentage: 25,
        createdAt: new Date().toISOString(),
      };

      const newActivity = {
        _id: generateId(),
        user: userId,
        action: 'account_created',
        title: 'Joined SkillBridge',
        description: `Registered student account with ${newUser.department} (${newUser.year})`,
        createdAt: new Date().toISOString(),
      };

      db.users.push(newUser);
      db.studentprofiles.push(newProfile);
      db.activities.push(newActivity);
      writeDb(db);

      return sendTokenResponse(newUser, 201, res);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Login student
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your college email and password.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (isConnected()) {
      const user = await User.findOne({ email: cleanEmail }).select('+password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Please verify your email and password.',
        });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Please verify your email and password.',
        });
      }

      return sendTokenResponse(user, 200, res, rememberMe);
    } else {
      const db = readDb();
      const user = db.users.find((u) => u.email === cleanEmail);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Please verify your email and password.',
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Please verify your email and password.',
        });
      }

      return sendTokenResponse(user, 200, res, rememberMe);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Logout student & clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Student logged out successfully.',
  });
};

// @desc    Get currently logged in student
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      const user = await User.findById(userId);
      const profile = await StudentProfile.findOne({ user: userId }).populate('skills');
      return res.status(200).json({
        success: true,
        user,
        profile,
      });
    } else {
      const db = readDb();
      const user = db.users.find((u) => u._id === userId || u.id === userId);
      const profile = db.studentprofiles.find((p) => p.user === userId);

      if (profile) {
        const populatedSkills = (profile.skills || []).map((skId) =>
          db.skills.find((s) => s._id === skId || s.name === skId) || { _id: skId, name: skId }
        );
        const fullProfile = {
          ...profile,
          skills: populatedSkills,
          user: user ? { name: user.name, email: user.email, department: user.department, year: user.year } : null,
        };
        const { password, ...safeUser } = user || {};
        return res.status(200).json({
          success: true,
          user: safeUser,
          profile: fullProfile,
        });
      }

      const { password, ...safeUser } = user || {};
      return res.status(200).json({
        success: true,
        user: safeUser,
        profile: null,
      });
    }
  } catch (error) {
    next(error);
  }
};
