// server.js — Entry point for the FylShare backend API

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables from .env
dotenv.config();

const connectDB = require('./config/db');
const { startExpiryCron } = require('./jobs/expiryCron');
const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────

// Allow requests from the React frontend
app.use(cors({ origin: 'https://fylflyy.vercel.app/' }));

// Parse incoming JSON request bodies
app.use(express.json());

// Parse URL-encoded form data (e.g. HTML forms)
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────────────────────────────────

// Mount the main router
const indexRoutes = require('./routes/index');
app.use('/', indexRoutes);

// Mount upload routes under /api
const uploadRoutes = require('./routes/uploadRoutes');
app.use('/api', uploadRoutes);

// ── 404 Handler ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route '${req.originalUrl}' not found`,
  });
});

// ── Global Error Handler ─────────────────────────────────────────────────────

// Must have 4 parameters so Express recognises it as an error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

// ── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  // Start background cron job for expired-file cleanup
  startExpiryCron();

  app.listen(PORT, () => {
    console.log(`\n🚀  FylShare server running on http://localhost:${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV}`);
    console.log(`   App Name    : ${process.env.APP_NAME}\n`);
  });
};

startServer();

