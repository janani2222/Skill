const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skillbridge_db', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[SkillBridge] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[SkillBridge] MongoDB Connection Error: ${error.message}`);
    console.error(`[SkillBridge] Please ensure MongoDB is running locally on mongodb://127.0.0.1:27017`);
  }
};

module.exports = connectDB;
