const cloudinary = require("../config/cloudinary");
const transporter = require("../config/otp");
const File = require("../models/File");

// ── Helper ───────────────────────────────────────────────

// Generate a random 6-character code (4 unique digits + 2 letters, shuffled)
const generateCode = () => {
  const digits = "0123456789";
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  const result = [];

  // 4 unique digits
  const usedDigits = new Set();
  while (usedDigits.size < 4) {
    usedDigits.add(digits[Math.floor(Math.random() * digits.length)]);
  }
  result.push(...usedDigits);

  // 2 letters
  for (let i = 0; i < 2; i++)
    result.push(letters[Math.floor(Math.random() * letters.length)]);

  // Fisher-Yates shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join("");
};

// ── Controllers ─────────────────────────────────────────

// GET all files
const getAllFiles = async (req, res) => {
  try {
    const files = await File.find().sort({ uploadedAt: -1 });
    res.json({ success: true, files });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch files" });
  }
};

// GET file by ID
const getFileById = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: "File not found" });
    }
    res.json({ success: true, file });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch file" });
  }
};

// POST /api/upload — Upload file + email the access code
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    if (!req.body.email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // 1️⃣ Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto",
    });

    // 2️⃣ Generate access code + 3-hour expiry
    const code = generateCode();
    const expiryTime = new Date(Date.now() + 3 * 60 * 60 * 1000);

    // 3️⃣ Save file record to MongoDB
    const newFile = await File.create({
      fileName: req.file.originalname,
      fileUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
      size: req.file.size,
      type: req.file.mimetype,
      email: req.body.email,
      code,
      expiryTime,
    });

    // 4️⃣ Send access code to recipient's email
    const senderMessage = req.body.message ? req.body.message.trim() : "";

    await transporter.sendMail({
      from: `"FYLFLY" <${process.env.EMAIL_USER}>`,
      to: req.body.email,
      subject: "Your File Access Code — FYLFLY",
      text: `Your file access code is: FYL-${code}\n\n${senderMessage ? `Your friend's message:\n"${senderMessage}"\n\n` : ""}Enter this code on the Retrieve page to download your file.\nThe code is valid for 3 hours (until ${expiryTime.toLocaleTimeString()}).`,
      html: `
        <p>Greetings..,</p>
        <p>A file has been shared by your friend with you, via <strong>FYLFLY</strong>.</p>
        ${senderMessage ? `
        <div style="margin: 16px 0; padding: 12px 16px; border-left: 4px solid #6c63ff; background: #f5f4ff; border-radius: 4px;">
          <p style="margin: 0; font-style: italic; color: #444;">“${senderMessage}”</p>
        </div>` : ""}
        <p>Your access code is:</p>
        <h2 style="letter-spacing: 8px; font-size: 32px; color: #4a4af4;">FYL-${code}</h2>
        <p>Enter this code on the <strong>Retrieve</strong> page to download your file.</p>
        <p><em>Valid until <strong>${expiryTime.toLocaleTimeString()}</strong> (3 hours).</em></p>
      `,
    });

    // 5️⃣ Return code + expiry to frontend
    res.status(201).json({
      success: true,
      message: "File uploaded & access code sent",
      code: newFile.code,
      expiryTime: newFile.expiryTime,
    });

  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
};

// POST /api/retrieve — Retrieve file using the access code
const retrieveFile = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: "Access code is required" });
    }

    // Strip "FYL-" prefix if user pastes the full branded code
    const cleanCode = code.trim().replace(/^FYL-/i, "");

    const file = await File.findOne({ code: cleanCode });

    if (!file) {
      return res.status(404).json({ success: false, message: "Invalid code — no file found" });
    }

    if (new Date() > new Date(file.expiryTime)) {
      return res.status(410).json({ success: false, message: "This file has expired and is no longer available" });
    }

    res.json({
      success: true,
      fileName: file.fileName,
      fileUrl: file.fileUrl,
      expiryTime: file.expiryTime,
    });

  } catch (err) {
    console.error("Retrieve Error:", err);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// DELETE file
const deleteFile = async (req, res) => {
  try {
    const file = await File.findByIdAndDelete(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: "File not found" });
    }
    if (file.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(file.cloudinaryPublicId);
    }
    res.json({ success: true, message: "File deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};

module.exports = {
  getAllFiles,
  getFileById,
  uploadFile,
  retrieveFile,
  deleteFile,
};
