const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isConnected } = require('../config/db');
const { readDb } = require('../config/localDb');

const protect = async (req, res, next) => {
  let token;

  // Check Authorization header or cookies
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please log in.',
    });
  }

  try {
    const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'skillbridge_super_secret_jwt_key_2026_secure');
    if (!secret) return res.status(500).json({ success: false, message: 'Authentication is not configured.' });
    const decoded = jwt.verify(token, secret);
    req.sessionExpiresAt = Number(decoded.exp) * 1000;

    if (isConnected()) {
      req.user = await User.findById(decoded.id).select('-password');
    } else {
      const db = readDb();
      const localUser = db.users.find((u) => u._id === decoded.id || u.id === decoded.id);
      if (localUser) {
        const { password, ...safeUser } = localUser;
        req.user = safeUser;
      }
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }
    if (req.user.active === false) return res.status(403).json({ success: false, message: 'This account has been deactivated.' });

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.',
    });
  }
};

module.exports = { protect };
