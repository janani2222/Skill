const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { isConnected } = require('../config/db');
const { readDb, writeDb } = require('../config/localDb');

const idOf = (req) => String(req.user._id || req.user.id);
const defaults = {
  notifications: { project: true, task: true, workshop: true, community: true },
  appearance: 'system',
  privacy: { profileVisibility: 'students', showEmail: false, allowMessages: true },
};
const merge = (value = {}) => ({
  notifications: { ...defaults.notifications, ...(value.notifications || {}) },
  appearance: ['light', 'dark', 'system'].includes(value.appearance) ? value.appearance : defaults.appearance,
  privacy: { ...defaults.privacy, ...(value.privacy || {}) },
});

exports.getSettings = async (req, res, next) => {
  try {
    if (isConnected()) {
      const user = await User.findById(idOf(req)).select('preferences');
      return res.json({ success: true, settings: merge(user?.preferences) });
    }
    const user = readDb().users.find((item) => String(item._id) === idOf(req));
    res.json({ success: true, settings: merge(user?.preferences) });
  } catch (error) { next(error); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const nextSettings = merge(req.body);
    if (isConnected()) {
      const user = await User.findByIdAndUpdate(idOf(req), { $set: { preferences: nextSettings } }, { new: true, runValidators: true }).select('preferences');
      return res.json({ success: true, settings: merge(user.preferences) });
    }
    const db = readDb(); const user = db.users.find((item) => String(item._id) === idOf(req));
    if (!user) return res.status(404).json({ success: false, message: 'Account not found.' });
    user.preferences = nextSettings; writeDb(db);
    res.json({ success: true, settings: nextSettings });
  } catch (error) { next(error); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) return res.status(400).json({ success: false, message: 'Enter the current password and matching new passwords.' });
    if (newPassword.length < 8) return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
    if (isConnected()) {
      const user = await User.findById(idOf(req)).select('+password');
      if (!user || !(await user.matchPassword(currentPassword))) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      user.password = newPassword; await user.save();
      return res.json({ success: true, message: 'Password updated successfully.' });
    }
    const db = readDb(); const user = db.users.find((item) => String(item._id) === idOf(req));
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    user.password = await bcrypt.hash(newPassword, 10); writeDb(db);
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) { next(error); }
};
