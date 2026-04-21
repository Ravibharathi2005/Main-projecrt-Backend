const mongoose = require("mongoose");
const dotenv = require("dotenv");
const CompanyEmployee = require("./src/models/CompanyEmployee");
const Task = require("./models/Task");
const Attendance = require("./models/Attendance");
const Salary = require("./models/Salary");
const connectDB = require("./src/config/db");

dotenv.config();

const seedHistorical = async () => {
  try {
    await connectDB();
    
    // Get all real employees from the "Data Sheet"
    const employees = await CompanyEmployee.find();
    console.log(`Found ${employees.length} employees to seed historical data for.`);

    // Clear existing historical data
    await Task.deleteMany({});
    await Attendance.deleteMany({});
    await Salary.deleteMany({});
    console.log("Historical datasets cleared.");

    for (const emp of employees) {
      const { employeeId, position, department } = emp;

      // 1. Seed Salary (Based on approved position logic)
      let base = 45000;
      const pos = position.toUpperCase();
      if (pos.includes("CEO") || pos.includes("CTO") || pos.includes("PRESIDENT")) base = 185000;
      else if (pos.includes("ADMIN") || pos.includes("MANAGER") || pos.includes("LEAD")) base = 95000;
      else if (pos.includes("ENGINEER") || pos.includes("ANALYST")) base = 72000;

      const salaries = [
        { employeeId, month: "April 2026", basicSalary: base, allowances: Math.floor(base*0.05), deductions: Math.floor(base*0.1), netSalary: Math.floor(base*0.95), status: "PAID" },
        { employeeId, month: "March 2026", basicSalary: base, allowances: Math.floor(base*0.05), deductions: Math.floor(base*0.1), netSalary: Math.floor(base*0.95), status: "PAID" }
      ];
      await Salary.insertMany(salaries);

      // 2. Seed Tasks (Based on approved department logic)
      const dept = department.toUpperCase();
      let tasks = [];
      if (dept.includes("ANALYTICS") || dept.includes("OPERATIONS")) {
        tasks = [
          { employeeId, title: `${department} Performance Audit`, priority: "HIGH", status: "DONE", deadline: new Date("2026-04-10"), category: "Analytics" },
          { employeeId, title: "Operations Scaling Proposal", priority: "MEDIUM", status: "IN_PROGRESS", deadline: new Date("2026-05-15"), category: "Ops" }
        ];
      } else if (dept.includes("SECURITY")) {
        tasks = [
          { employeeId, title: "Endpoint Hardening (Phase 1)", priority: "URGENT", status: "DONE", deadline: new Date("2026-04-12"), category: "Security" },
          { employeeId, title: "Firewall Configuration Audit", priority: "HIGH", status: "DONE", deadline: new Date("2026-05-02"), category: "Network" }
        ];
      } else {
        tasks = [
          { employeeId, title: `General ${department} Objective`, priority: "LOW", status: "TODO", deadline: new Date("2026-05-20"), category: "Standard" }
        ];
      }
      await Task.insertMany(tasks);

      // 3. Seed Attendance (Simplified historical log)
      const attendance = [
        { employeeId, date: "2026-04-18", checkIn: new Date("2026-04-18T09:00:00"), checkOut: new Date("2026-04-18T17:30:00"), status: "PRESENT", workHours: 8.5 },
        { employeeId, date: "2026-04-19", checkIn: new Date("2026-04-19T08:45:00"), checkOut: new Date("2026-04-19T17:15:00"), status: "PRESENT", workHours: 8.5 },
        { employeeId, date: "2026-04-20", checkIn: new Date("2026-04-20T09:15:00"), checkOut: new Date("2026-04-20T18:00:00"), status: "PRESENT", workHours: 8.75 }
      ];
      await Attendance.insertMany(attendance);
    }

    console.log("Historical data synchronization complete.");
    process.exit(0);
  } catch (err) {
    console.error("Historical seeding error:", err);
    process.exit(1);
  }
};

seedHistorical();
