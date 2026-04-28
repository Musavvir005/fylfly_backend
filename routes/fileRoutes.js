// routes/fileRoutes.js — Routes for file operations
// Base path: /files  (mounted in routes/index.js)

const express = require('express');
const router = express.Router();

const fileController = require('../controllers/fileController');

// GET  /files        — list all available (mock) files
router.get('/', fileController.getAllFiles);

// GET  /files/:id    — retrieve a single file by share code
router.get('/:id', fileController.getFileById);

// POST /files/upload — upload a new file (body only for now, no multer yet)
router.post('/upload', fileController.uploadFile);

// DELETE /files/:id  — delete / expire a file early
router.delete('/:id', fileController.deleteFile);

module.exports = router;
