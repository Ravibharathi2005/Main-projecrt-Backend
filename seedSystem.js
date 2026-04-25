const mongoose = require("mongoose");
const dotenv = require("dotenv");
const CompanyEmployee = require("./src/models/CompanyEmployee");
const User = require("./src/models/User");
const Task = require("./src/models/Task");
const Attendance = require("./src/models/Attendance");
const Salary = require("./src/models/Salary");
const ActivityLog = require("./src/models/ActivityLog");
const Alert = require("./src/models/Alert");
const Session = require("./src/models/Session");
const Role = require("./src/models/Role");
const connectDB = require("./src/config/db");

dotenv.config();

const employees = [
    { 
      employeeId: "EMP1001", name: "Arun Kumar", company: "ABC Tech Solutions", department: "Executive", position: "CEO",
      email: "arun.kumar@abctech.com", phone: "+1 555-0101", joiningDate: "2018-05-12", dob: "1980-08-25", gender: "Male",
      address: "123 Corporate Blvd, San Jose, CA", emergencyContact: "Anita Kumar (+1 555-0102)", manager: "Board of Directors",
      employmentType: "Full-Time", workLocation: "Headquarters", shift: "Flexible", salaryGrade: "E10",
      skills: ["Strategic Leadership", "Enterprise Architecture", "Mergers & Acquisitions"], status: "ACTIVE"
    },
    { 
      employeeId: "EMP1002", name: "Priya Sharma", company: "ABC Tech Solutions", department: "Executive", position: "CTO",
      email: "priya.sharma@abctech.com", phone: "+1 555-0103", joiningDate: "2019-02-15", dob: "1985-04-12", gender: "Female",
      address: "456 Innovation Way, San Francisco, CA", emergencyContact: "Raj Sharma (+1 555-0104)", manager: "Arun Kumar",
      employmentType: "Full-Time", workLocation: "Headquarters", shift: "Flexible", salaryGrade: "E9",
      skills: ["Cloud Infrastructure", "Product Strategy", "AI/ML Oversight"], status: "ACTIVE"
    },
    { 
      employeeId: "EMP1003", name: "Rahul Verma", company: "ABC Tech Solutions", department: "Security", position: "System Admin",
      email: "rahul.verma@abctech.com", phone: "+1 555-0105", joiningDate: "2020-11-20", dob: "1992-09-30", gender: "Male",
      address: "789 Sentinel St, Austin, TX", emergencyContact: "Sonal Verma (+1 555-0106)", manager: "Mark Jenkins",
      employmentType: "Full-Time", workLocation: "Remote (Hybrid)", shift: "Standard (09:00 - 18:00)", salaryGrade: "G6",
      skills: ["Network Security", "Linux Administration", "Intrusion Detection"], status: "ACTIVE"
    },
    { 
      employeeId: "EMP1004", name: "Sneha Iyer", company: "ABC Tech Solutions", department: "Engineering", position: "Software Engineer",
      email: "sneha.iyer@abctech.com", phone: "+1 555-0107", joiningDate: "2021-06-01", dob: "1995-12-14", gender: "Female",
      address: "321 Dev Lane, Seattle, WA", emergencyContact: "Lakshmi Iyer (+1 555-0108)", manager: "Priya Sharma",
      employmentType: "Full-Time", workLocation: "Remote", shift: "Standard (09:00 - 18:00)", salaryGrade: "G4",
      skills: ["React", "Node.js", "MongoDB"], status: "ACTIVE"
    },
    { 
      employeeId: "EMP1005", name: "Vikram Singh", company: "ABC Tech Solutions", department: "HR", position: "Personnel Manager",
      email: "vikram.singh@abctech.com", phone: "+1 555-0109", joiningDate: "2017-09-10", dob: "1988-01-05", gender: "Male",
      address: "555 People Rd, Denver, CO", emergencyContact: "Meera Singh (+1 555-0110)", manager: "Sara Collins",
      employmentType: "Full-Time", workLocation: "Denver Office", shift: "Standard (09:00 - 18:00)", salaryGrade: "M3",
      skills: ["Conflict Resolution", "Talent Acquisition", "Employee Relations"], status: "ACTIVE"
    }
];

const seedSystem = async () => {
  try {
    await connectDB();
    
    // Clear all business and auth collections
    await CompanyEmployee.deleteMany({});
    await User.deleteMany({});
    await Task.deleteMany({});
    await Attendance.deleteMany({});
    await Salary.deleteMany({});
    await ActivityLog.deleteMany({});
    await Alert.deleteMany({});
    await Session.deleteMany({});
    await Role.deleteMany({});
    console.log("✅ All collections cleared for synchronization (System Reset)");

    // 1. Seed Company Employees
    await CompanyEmployee.insertMany(employees);
    console.log(`✅ ${employees.length} employees seeded into registry`);

    // 2. Seed Users with default password (bypass middleware to ensure exact hash)
    const bcrypt = require("bcrypt");
    const testPassword = "password123";
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(testPassword, salt);

    console.log(`🔑 Seeding with direct hash (bypass middleware): ${hashedPassword}`);

    const userDocs = employees.map(emp => ({
        employeeId: emp.employeeId,
        name: emp.name,
        company: emp.company,
        position: emp.position,
        department: emp.department,
        role: (emp.position === "CEO" || emp.position === "CTO") ? "ADMIN" : 
              (emp.department === "Security") ? "SECURITY_ANALYST" : 
              (emp.department === "HR") ? "HR" : "EMPLOYEE",
        password: hashedPassword,
        trustScore: 100,
        riskLevel: "LOW",
        deviceHistory: [],
        failedLoginAttempts: 0,
        alerts: [],
        isBiometricEnrolled: false,
        createdAt: new Date(),
        updatedAt: new Date()
    }));

    await User.collection.insertMany(userDocs);
    console.log("✅ User authentication accounts synchronized (Direct Injection)");

    // 3. Seed Historical Data for EMP1001 (for demo)
    const emp1001 = employees[0];
    await Task.insertMany([
        { employeeId: emp1001.employeeId, title: "Q3 Strategic Roadmap Review", priority: "HIGH", status: "TODO", deadline: new Date("2026-05-10") },
        { employeeId: emp1001.employeeId, title: "Quarterly Town Hall Presentation", priority: "MEDIUM", status: "DONE", deadline: new Date("2026-04-15") }
    ]);
    await Salary.insertMany([
        { employeeId: emp1001.employeeId, month: "April 2026", basicSalary: 185000, allowances: 5000, deductions: 2000, netSalary: 188000, status: "PAID" },
        { employeeId: emp1001.employeeId, month: "March 2026", basicSalary: 185000, allowances: 5000, deductions: 2000, netSalary: 188000, status: "PAID" }
    ]);
    await Attendance.insertMany([
        { employeeId: emp1001.employeeId, date: "2026-04-20", checkIn: new Date("2026-04-20T08:30:00"), checkOut: new Date("2026-04-20T17:30:00"), status: "PRESENT", workHours: 9 }
    ]);

    // 4. Seed Default Roles
    const roles = [
      { roleName: "SUPER_ADMIN", permissions: ["ALL"], description: "Full system access" },
      { roleName: "ADMIN", permissions: ["USER_MANAGEMENT", "SYSTEM_CONFIG"], description: "Administrative access" },
      { roleName: "SECURITY_ANALYST", permissions: ["VIEW_LOGS", "MANAGE_ALERTS"], description: "Security monitoring access" },
      { roleName: "HR", permissions: ["EMPLOYEE_MANAGEMENT", "SALARY_MANAGEMENT"], description: "Human resources access" },
      { roleName: "EMPLOYEE", permissions: ["VIEW_DASHBOARD", "MARK_ATTENDANCE"], description: "Standard employee access" }
    ];
    await Role.insertMany(roles);
    console.log(`✅ ${roles.length} system roles initialized`);

    // 5. Seed Sample Alerts for EMP1001
    await Alert.insertMany([
      { employeeId: "EMP1001", message: "Multiple invalid login attempts from new location", severity: "HIGH", status: "OPEN" },
      { employeeId: "EMP1001", message: "Profile information updated: address", severity: "LOW", status: "RESOLVED" }
    ]);
    console.log("✅ Sample security alerts synchronized");

    console.log("✅ Historical demographics synchronized");
    console.log("\n--- SYSTEM READY ---");
    console.log("Login: EMP1001");
    console.log("Password: password123");
    
    process.exit(0);
  } catch (err) {
    console.error("Critical seeding error:", err);
    process.exit(1);
  }
};

seedSystem();
