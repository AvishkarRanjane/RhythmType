require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');

const db = require('./src/config/database');
const authRoutes = require('./src/routes/authRoutes');
const scoreRoutes = require('./src/routes/scoreRoutes');
const userRoutes = require('./src/routes/userRoutes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Parsing Middleware
app.use(helmet({
  contentSecurityPolicy: false // Allows canvas inline charts & audio context in frontend
}));
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve Static Frontend Assets
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/users', userRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    driver: db.isPostgres ? 'PostgreSQL' : 'SQLite'
  });
});

// Direct SPA Routes Fallback
app.get('/leaderboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/leaderboard.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/profile.html'));
});

// Global Error Handler
app.use(errorHandler);

// Initialize DB and Start Server (Local execution)
let serverInitialized = false;

async function initServer() {
  if (!serverInitialized) {
    try {
      await db.initDb();
      serverInitialized = true;
    } catch (err) {
      console.error('[Server] Database initialization failed:', err);
    }
  }
}

// Ensure DB is initialized before handling requests in serverless environments
app.use(async (req, res, next) => {
  if (!serverInitialized) {
    await initServer();
  }
  next();
});

if (require.main === module) {
  initServer().then(() => {
    app.listen(PORT, () => {
      console.log(`[RhythmType] Server listening on http://localhost:${PORT}`);
    });
  });
}

module.exports = app;
