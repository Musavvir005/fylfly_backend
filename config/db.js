const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // Wait up to 10s before giving up
    });
    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("  MongoDB connection failed:", err.message);
    process.exit(1); // stop the server if DB fails
  }
};

module.exports = connectDB;
