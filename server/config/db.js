const mongoose = require('mongoose');

// Disable buffering so queries fail or fallback immediately instead of hanging for 10s
mongoose.set('bufferCommands', false);

let isMongoConnected = false;

const connectDB = async () => {
  try {
    if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) throw new Error('MONGODB_URI must be configured in production.');
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skillbridge_db';
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    isMongoConnected = true;
    console.log(`===============================================`);
    console.log(`[SkillBridge] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    console.log(`===============================================`);
  } catch (error) {
    isMongoConnected = false;
    console.log(`-----------------------------------------------`);
    console.log(`[SkillBridge] MongoDB notice: ${error.message}`);
    if (process.env.VERCEL) {
      console.log('[SkillBridge] Vercel local storage is temporary; configure MONGODB_URI for persistent data.');
    } else {
      console.log(`[SkillBridge] Running with automatic local persistent storage in server/data/`);
      console.log(`[SkillBridge] To connect MongoDB directly, run: net start MongoDB`);
    }
    console.log(`-----------------------------------------------`);
  }
};

const isConnected = () => isMongoConnected && mongoose.connection.readyState === 1;

module.exports = connectDB;
module.exports.isConnected = isConnected;
