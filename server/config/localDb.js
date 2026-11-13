const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const dataDir = path.join(__dirname, '..', 'data');
const dbFile = path.join(dataDir, 'skillbridge_db.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial clean database template with projects collection
const initialDb = {
  users: [],
  studentprofiles: [],
  skills: [],
  projects: [],
  projectmembers: [],
  joinrequests: [],
  notifications: [],
  chatrooms: [],
  chatmessages: [],
  activities: [],
  projecttasks: [],
  projectmilestones: [],
  progressupdates: [],
  adminlogs: [],
};

// Load database from disk or initialize
const readDb = () => {
  try {
    if (!fs.existsSync(dbFile)) {
      fs.writeFileSync(dbFile, JSON.stringify(initialDb, null, 2), 'utf-8');
      return initialDb;
    }
    const data = fs.readFileSync(dbFile, 'utf-8');
    const parsed = JSON.parse(data);
    if (!parsed.projects) parsed.projects = [];
    if (!parsed.projectmembers) parsed.projectmembers = [];
    if (!parsed.joinrequests) parsed.joinrequests = [];
    if (!parsed.notifications) parsed.notifications = [];
    if (!parsed.chatrooms) parsed.chatrooms = [];
    if (!parsed.chatmessages) parsed.chatmessages = [];
    ['projecttasks', 'projectmilestones', 'progressupdates', 'adminlogs'].forEach((key) => { if (!parsed[key]) parsed[key] = []; });
    return parsed;
  } catch (err) {
    console.error('[SkillBridge LocalDB Error]', err);
    return initialDb;
  }
};

const writeDb = (db) => {
  try {
    if (!db.projects) db.projects = [];
    if (!db.projectmembers) db.projectmembers = [];
    if (!db.joinrequests) db.joinrequests = [];
    if (!db.notifications) db.notifications = [];
    if (!db.chatrooms) db.chatrooms = [];
    if (!db.chatmessages) db.chatmessages = [];
    ['projecttasks', 'projectmilestones', 'progressupdates', 'adminlogs'].forEach((key) => { if (!db[key]) db[key] = []; });
    fs.writeFileSync(dbFile, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('[SkillBridge LocalDB Write Error]', err);
  }
};

// Generate standard MongoDB ObjectId
const generateId = () => new mongoose.Types.ObjectId().toString();

module.exports = {
  readDb,
  writeDb,
  generateId,
};
