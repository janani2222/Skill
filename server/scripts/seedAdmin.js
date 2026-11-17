const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { readDb, writeDb, generateId } = require('../config/localDb');
const { isConnected } = require('../config/db');
const User = require('../models/User');

dotenv.config();

async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    if (process.env.NODE_ENV === 'production') throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be configured in production.');
    console.warn('[SkillBridge] Admin seed skipped: configure ADMIN_EMAIL and ADMIN_PASSWORD in server/.env.');
    return null;
  }
  if (process.env.NODE_ENV === 'production' && !isConnected()) {
    throw new Error('MongoDB must be connected before seeding the production admin account.');
  }
  const hash = await bcrypt.hash(password, 12);
  if (isConnected()) {
    const existing = await User.findOne({ $or: [{ email }, { username }] }).select('+password');
    if (existing && existing.email !== email && existing.username !== username) {
      throw new Error('The configured admin identity conflicts with an existing account.');
    }
    const user = existing || new User({ name: 'SkillBridge Administrator', email, username, department: 'Other', year: 'Fourth Year', role: 'admin' });
    user.password = hash; user.role = 'admin'; user.active = true; await user.save();
    return user;
  }
  const db = readDb();
  const conflict = db.users.find((item) => item.username === username && item.email !== email);
  if (conflict) throw new Error('The configured admin identity conflicts with an existing account.');
  let user = db.users.find((item) => item.email === email && item.username === username);
  if (!user) { user = { _id: generateId(), name: 'SkillBridge Administrator', email, username, department: 'Other', year: 'Fourth Year', role: 'admin', createdAt: new Date().toISOString() }; db.users.push(user); }
  user.password = hash; user.role = 'admin'; user.active = true; writeDb(db); return user;
}

module.exports = seedAdmin;
if (require.main === module) {
  const connectDB = require('../config/db');
  connectDB().then(seedAdmin).then(() => process.exit(0)).catch((error) => { console.error(`[SkillBridge] Admin seed failed: ${error.message}`); process.exit(1); });
}
