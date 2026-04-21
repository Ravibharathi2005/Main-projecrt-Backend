const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./src/models/User");
const connectDB = require("./src/config/db");

dotenv.config();

const verifyLogin = async () => {
  try {
    await connectDB();
    const employeeId = "EMP1001";
    const password = "password123";
    
    const user = await User.findOne({ employeeId });
    if (!user) {
      console.log("❌ User EMP1001 not found in database");
      process.exit(1);
    }
    
    console.log("✅ User found:", user.name);
    console.log("Hashed Password in DB:", user.password);
    
    const isMatch = await user.comparePassword(password);
    if (isMatch) {
      console.log("✅ Password validation SUCCESSFUL");
    } else {
      console.log("❌ Password validation FAILED");
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

verifyLogin();
