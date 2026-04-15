const User = require("../models/User");
const CompanyEmployee = require("../models/CompanyEmployee");

// Register user
const register = async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    // Validate input
    if (!employeeId || !password) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and password are required",
      });
    }

    // Check if employee exists in companyEmployees
    const employee = await CompanyEmployee.findOne({ employeeId });
    if (!employee) {
      return res.status(400).json({
        success: false,
        message: "Invalid Employee ID",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ employeeId });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already registered",
      });
    }

    // Determine role based on position
    const role = employee.position === "CEO" ? "ADMIN" : "USER";

    // Create new user
    const newUser = new User({
      employeeId,
      name: employee.name,
      company: employee.company,
      role,
      password, // Will be hashed by pre-save hook
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      role: newUser.role,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Login (existing, but can be updated if needed)
const login = async (req, res) => {
  // Existing login logic can be kept or updated
};

module.exports = {
  register,
  login,
};