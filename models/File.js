const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  fileName: String,
  fileUrl: String,
  cloudinaryPublicId: String,   // stored so the cron can delete from Cloudinary
  size: Number,
  type: String,

  email: String,                // recipient email — used to send the access code
  code: String,                 // 6-digit reusable access code (valid 3 hrs)

  expiryTime: Date,             // uploadedAt + 3 hours — file is purged after this

  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("File", fileSchema);