const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("./src/models/User");

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const users = await User.find({}, "employeeId role position");
    console.log("Current Users and Roles:");
    console.table(users.map(u => ({
      employeeId: u.employeeId,
      role: u.role,
      position: u.position
    })));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkUsers();
