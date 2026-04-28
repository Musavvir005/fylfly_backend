const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const {
  getAllFiles,
  getFileById,
  uploadFile,
  retrieveFile,
  deleteFile,
} = require("../controllers/fileController");

// Upload file + send access code to email
router.post("/upload", upload.single("file"), uploadFile);

// Retrieve file using access code only
router.post("/retrieve", retrieveFile);

// CRUD helpers
router.get("/files", getAllFiles);
router.get("/files/:id", getFileById);
router.delete("/files/:id", deleteFile);

module.exports = router;
