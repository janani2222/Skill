const mongoose = require('mongoose');

// Disable buffering so queries fail or fallback immediately instead of hanging for 10s
mongoose.set('bufferCommands', false);

let isMongoConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skillbridge_db';
  try {
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
    console.log(`[SkillBridge] Running with automatic local persistent storage in server/data/`);
    console.log(`[SkillBridge] To connect MongoDB directly, run: net start MongoDB`);
    console.log(`-----------------------------------------------`);
  }
};

const isConnected = () => isMongoConnected && mongoose.connection.readyState === 1;

module.exports = connectDB;
module.exports.isConnected = isConnected;
