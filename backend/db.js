const mongoose = require("mongoose");
require("dotenv").config();

// Single source of truth for MongoDB connection URI.
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/plumbing_crm";

// Open DB connection at application startup.
mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch(err => {
    // Exit process so app does not run in partial/broken state.
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

module.exports = mongoose;
