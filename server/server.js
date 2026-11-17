const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/db');
const { isConnected } = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');
const uploadMiddleware = require('./middleware/uploadMiddleware');
const seedAdmin = require('./scripts/seedAdmin');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

// Connect to local MongoDB
const databaseReady = connectDB()
  .then(() => seedAdmin())
  .catch((error) => console.error(`[SkillBridge] Admin seed failed: ${error.message}`));

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Enable CORS with credentials for local dev
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use('/api', async (req, res, next) => {
  if (req.path === '/health' || process.env.NODE_ENV !== 'production') return next();
  await databaseReady;
  if (!isConnected()) {
    return res.status(503).json({
      success: false,
      message: 'Database is unavailable. Check the production MongoDB configuration and try again.',
    });
  }
  return next();
});

// Serve uploaded profile images statically
app.use('/uploads', express.static(uploadMiddleware.uploadDirectory));

// Mount routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/collaboration', require('./routes/collaborationRoutes'));
app.use('/api/team', require('./routes/teamRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api', require('./routes/dashboardRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const databaseConnected = isConnected();
  res.status(200).json({
    status: databaseConnected ? 'healthy' : 'degraded',
    message: databaseConnected
      ? 'SkillBridge API and database are running smoothly'
      : 'SkillBridge API is running, but the database is unavailable',
    database: databaseConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`[SkillBridge] Server running on port ${PORT}`);
  console.log(`[SkillBridge] Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[SkillBridge] Local API: http://localhost:${PORT}`);
  console.log(`===============================================`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`[Unhandled Error]: ${err.message}`);
});

