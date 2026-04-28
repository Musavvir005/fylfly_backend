// jobs/expiryCron.js — Scheduled job to purge expired files every 5 minutes

const cron = require("node-cron");
const cloudinary = require("../config/cloudinary");
const File = require("../models/File");

/**
 * Extract Cloudinary public_id from a secure_url.
 * Matches the same helper used in fileController.
 */
const extractPublicId = (url) => {
  try {
    const parts = url.split("/upload/");
    const afterUpload = parts[1];
    const withoutVersion = afterUpload.replace(/^v\d+\//, "");
    return withoutVersion.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
};

/**
 * Delete a single file from Cloudinary.
 * Tries both "raw" and default "image" resource types to cover all file kinds.
 */
const destroyFromCloudinary = async (publicId) => {
  const results = await Promise.allSettled([
    cloudinary.uploader.destroy(publicId, { resource_type: "raw" }),
    cloudinary.uploader.destroy(publicId, { resource_type: "image" }),
    cloudinary.uploader.destroy(publicId, { resource_type: "video" }),
  ]);
  // Return true if at least one succeeded with result "ok"
  return results.some(
    (r) => r.status === "fulfilled" && r.value?.result === "ok"
  );
};

/**
 * Main cleanup task — runs every 5 minutes.
 * Finds all File documents where expiryTime < now, deletes them from
 * Cloudinary first, then removes the MongoDB record.
 */
const startExpiryCron = () => {
  cron.schedule("*/5 * * * *", async () => {
    const now = new Date();
    console.log(`\n🕐 [ExpiryCron] Running cleanup at ${now.toISOString()}`);

    try {
      const expiredFiles = await File.find({ expiryTime: { $lt: now } });

      if (expiredFiles.length === 0) {
        console.log("   ✔ No expired files found.");
        return;
      }

      console.log(`   🗂  Found ${expiredFiles.length} expired file(s). Deleting...`);

      for (const file of expiredFiles) {
        const publicId =
          file.cloudinaryPublicId || extractPublicId(file.fileUrl);

        let cloudinaryOk = false;
        if (publicId) {
          cloudinaryOk = await destroyFromCloudinary(publicId);
          if (cloudinaryOk) {
            console.log(`   ☁  Cloudinary deleted: ${publicId}`);
          } else {
            console.warn(`   ⚠  Cloudinary delete may have failed for: ${publicId}`);
          }
        } else {
          console.warn(`   ⚠  Could not determine public_id for file: ${file._id}`);
        }

        // Remove from MongoDB regardless (avoids re-attempting on next tick)
        await File.findByIdAndDelete(file._id);
        console.log(`   🗑  MongoDB record deleted: ${file._id} (${file.fileName})`);
      }

      console.log(`   ✅ Cleanup complete — ${expiredFiles.length} file(s) purged.\n`);
    } catch (err) {
      console.error("   ❌ ExpiryCron error:", err.message);
    }
  });

  console.log("⏰  File expiry cron job started (runs every 5 minutes).");
};

module.exports = { startExpiryCron };
