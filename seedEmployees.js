const mongoose = require("mongoose");
const dotenv = require("dotenv");
const CompanyEmployee = require("./src/models/CompanyEmployee");
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
  },
  { 
    employeeId: "EMP1006", name: "Meena Ravi", company: "ABC Tech Solutions", department: "QA", position: "QA Engineer",
    email: "meena.ravi@abctech.com", phone: "+1 555-0111", joiningDate: "2022-03-22", dob: "1994-06-18", gender: "Female",
    address: "777 Tester Dr, Boston, MA", emergencyContact: "Ravi Shankar (+1 555-0112)", manager: "David Wu",
    employmentType: "Full-Time", workLocation: "Boston Office", shift: "Standard (09:00 - 18:00)", salaryGrade: "G4",
    skills: ["Selenium", "JMeter", "Test Automation"], status: "ACTIVE"
  },
  { 
    employeeId: "EMP1007", name: "Karthik Raj", company: "ABC Tech Solutions", department: "Design", position: "UI/UX Designer",
    email: "karthik.raj@abctech.com", phone: "+1 555-0113", joiningDate: "2021-01-15", dob: "1993-11-22", gender: "Male",
    address: "101 Pixel Pkwy, New York, NY", emergencyContact: "Raj Kumar (+1 555-0114)", manager: "Elena Vance",
    employmentType: "Full-Time", workLocation: "New York Office", shift: "Flexible", salaryGrade: "G5",
    skills: ["Figma", "Sketch", "Prototyping"], status: "ACTIVE"
  },
  { 
    employeeId: "EMP1008", name: "Divya Nair", company: "ABC Tech Solutions", department: "HR", position: "HR Executive",
    email: "divya.nair@abctech.com", phone: "+1 555-0115", joiningDate: "2023-05-10", dob: "1997-03-12", gender: "Female",
    address: "202 Culture Cir, Chicago, IL", emergencyContact: "Kiran Nair (+1 555-0116)", manager: "Vikram Singh",
    employmentType: "Full-Time", workLocation: "Chicago Office", shift: "Standard (09:00 - 18:00)", salaryGrade: "G3",
    skills: ["Payroll Management", "Onboarding", "Policy Documentation"], status: "ACTIVE"
  },
  { 
    employeeId: "EMP1009", name: "Ajay Patel", company: "ABC Tech Solutions", department: "Engineering", position: "Backend Developer",
    email: "ajay.patel@abctech.com", phone: "+1 555-0117", joiningDate: "2020-08-20", dob: "1991-07-04", gender: "Male",
    address: "303 Server St, Portland, OR", emergencyContact: "Leela Patel (+1 555-0118)", manager: "Priya Sharma",
    employmentType: "Full-Time", workLocation: "Remote", shift: "Standard (09:00 - 18:00)", salaryGrade: "G5",
    skills: ["Go", "Kubernetes", "PostgreSQL"], status: "ACTIVE"
  },
  { 
    employeeId: "EMP1010", name: "Nisha Gupta", company: "ABC Tech Solutions", department: "Data", position: "Data Analyst",
    email: "nisha.gupta@abctech.com", phone: "+1 555-0119", joiningDate: "2022-10-15", dob: "1996-02-28", gender: "Female",
    address: "404 Insight Rd, Houston, TX", emergencyContact: "Amit Gupta (+1 555-0120)", manager: "Arun Kumar",
    employmentType: "Full-Time", workLocation: "Headquarters", shift: "Standard (09:00 - 18:00)", salaryGrade: "G4",
    skills: ["Python", "Tableau", "Statistical Modeling"], status: "ACTIVE"
  }
];

const seedDB = async () => {
  try {
    await connectDB();
    
    // Clear existing employees
    await CompanyEmployee.deleteMany({});
    console.log("Existing employees cleared");
    
    // Insert new employees
    await CompanyEmployee.insertMany(employees);
    console.log(`${employees.length} employees seeded with full personnel data successfully`);
    
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

seedDB();
