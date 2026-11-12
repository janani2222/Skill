const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const dataDir = path.join(__dirname, '..', 'data');
const dbFile = path.join(dataDir, 'skillbridge_db.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial clean database template with NO hardcoded skills or interests
const initialDb = {
  users: [],
  studentprofiles: [],
  skills: [],
  activities: [],
};

// Load database from disk or initialize
const readDb = () => {
  try {
    if (!fs.existsSync(dbFile)) {
      fs.writeFileSync(dbFile, JSON.stringify(initialDb, null, 2), 'utf-8');
      return initialDb;
    }
    const data = fs.readFileSync(dbFile, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('[SkillBridge LocalDB Error]', err);
    return initialDb;
  }
};

const writeDb = (db) => {
  try {
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
