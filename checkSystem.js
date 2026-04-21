const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./src/models/User");
const CompanyEmployee = require("./src/models/CompanyEmployee");
const connectDB = require("./src/config/db");

dotenv.config();

const checkUsers = async () => {
  try {
    await connectDB();
    const users = await User.find({}, { employeeId: 1, name: 1, role: 1 });
    console.log("Registered Users in System:");
    console.table(users.map(u => ({ id: u.employeeId, name: u.name, role: u.role })));
    
    const employees = await CompanyEmployee.find({}, { employeeId: 1, name: 1 });
    console.log("\nEmployees in Registry:");
    console.table(employees.map(e => ({ id: e.employeeId, name: e.name })));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkUsers();
