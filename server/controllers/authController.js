const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Activity = require('../models/Activity');
const jwt = require('jsonwebtoken');

// Generate JWT token helper
const generateToken = (id, rememberMe = false) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'skillbridge_super_secret_jwt_key_2026_secure',
    {
      expiresIn: rememberMe ? '30d' : process.env.JWT_EXPIRE || '7d',
    }
  );
};

// Send token response with HTTP-only cookie and JSON data
const sendTokenResponse = (user, statusCode, res, rememberMe = false) => {
  const token = generateToken(user._id, rememberMe);

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
        id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        year: user.year,
        role: user.role,
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

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A student with this college email is already registered.',
      });
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      department,
      year,
    });

    // Create associated student profile
    const profile = await StudentProfile.create({
      user: user._id,
      aboutMe: `Hi, I am ${user.name}, currently in ${user.year} studying ${user.department}. Passionate about exploring technology and collaborating on innovative college projects!`,
      completionPercentage: 25,
    });

    // Record initial activity
    await Activity.create({
      user: user._id,
      action: 'account_created',
      title: 'Joined SkillBridge',
      description: `Registered student account with ${user.department} (${user.year})`,
    });

    sendTokenResponse(user, 201, res);
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

    // Check for user
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      '+password'
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
      });
    }

    sendTokenResponse(user, 200, res, rememberMe);
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
    const user = await User.findById(req.user.id);
    const profile = await StudentProfile.findOne({ user: req.user.id }).populate(
      'skills'
    );

    res.status(200).json({
      success: true,
      user,
      profile,
    });
  } catch (error) {
    next(error);
  }
};
