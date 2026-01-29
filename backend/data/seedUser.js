const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// MongoDB connection string
const MONGO_URI = "mongodb://127.0.0.1:27017/plumbing_crm";

const seedUser = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const User = mongoose.model("User", new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String
    }, { timestamps: true }));

    // Check if user already exists
    const existingUser = await User.findOne({ email: "admin@test.com" });
    if (existingUser) {
      console.log("Admin user already exists!");
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const adminUser = await User.create({
      name: "Admin User",
      email: "admin@test.com",
      password: hashedPassword,
      role: "ADMIN"
    });

    console.log("✓ Admin user created successfully!");
    console.log("Email: admin@test.com");
    console.log("Password: admin123");
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding user:", error);
    process.exit(1);
  }
};

seedUser();
