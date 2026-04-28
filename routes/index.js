// routes/index.js — Root-level router
// Registers all top-level routes and groups sub-routers by feature

const express = require('express');
const router = express.Router();

const indexController = require('../controllers/indexController');
const fileRoutes = require('./fileRoutes');

// ── Health / test route ───────────────────────────────────────────────────────

// GET /  →  "Server is running"
router.get('/', indexController.healthCheck);

// ── Feature routers ───────────────────────────────────────────────────────────

// All /files/* routes are handled by fileRoutes
router.use('/files', fileRoutes);

module.exports = router;
