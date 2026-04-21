const Salary = require("../models/Salary");
const CompanyEmployee = require("../models/CompanyEmployee");

exports.getSalaries = async (req, res) => {
  try {
    const { employeeId } = req.user;
    const records = await Salary.find({ employeeId }).sort({ month: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Error fetching payroll" });
  }
};

// Seed helper with position-based logic
exports.createSampleSalary = async (req, res) => {
  try {
    const { employeeId } = req.user;
    const employee = await CompanyEmployee.findOne({ employeeId: employeeId.toUpperCase() });
    
    if (!employee) return res.status(404).json({ message: "Employee not found in registry" });

    // Determine basic salary based on position hierarchy
    let base = 45000; // Default Support/General
    const pos = employee.position.toUpperCase();

    if (pos.includes("CEO") || pos.includes("CTO") || pos.includes("PRESIDENT")) {
      base = 185000;
    } else if (pos.includes("ADMIN") || pos.includes("MANAGER") || pos.includes("LEAD")) {
      base = 95000;
    } else if (pos.includes("ENGINEER") || pos.includes("ANALYST") || pos.includes("DESIGNER")) {
      base = 72000;
    }

    const samples = [
      { 
        employeeId, 
        month: "April 2026", 
        basicSalary: base, 
        allowances: Math.floor(base * 0.05), 
        deductions: Math.floor(base * 0.12), 
        netSalary: Math.floor(base * 0.93),
        status: "PAID"
      },
      { 
        employeeId, 
        month: "March 2026", 
        basicSalary: base, 
        allowances: Math.floor(base * 0.05), 
        deductions: Math.floor(base * 0.12), 
        netSalary: Math.floor(base * 0.93),
        status: "PAID"
      }
    ];

    // Clear old seeded salaries for this user to avoid duplicates
    await Salary.deleteMany({ employeeId });
    await Salary.insertMany(samples);
    
    res.json({ message: "Synchronized salary records with position registry", data: samples });
  } catch (error) {
    console.error("Salary seed error:", error);
    res.status(500).json({ message: "Error seeding payroll" });
  }
};
