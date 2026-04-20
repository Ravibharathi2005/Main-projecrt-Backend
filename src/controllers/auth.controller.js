const jwt = require("jsonwebtoken");
const User = require("../models/User");
const CompanyEmployee = require("../models/CompanyEmployee");

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";
const JWT_EXPIRES_IN = "1h";

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
    const role = ["CEO", "CTO"].includes(employee.position) ? "ADMIN" : "USER";

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

// Login using companyemployees master data
const login = async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    if (!employeeId || !password) {
      return res.status(401).json({ message: "Login failed" });
    }

    const employee = await CompanyEmployee.findOne({ employeeId });
    if (!employee) {
      return res.status(401).json({
        message: "Login failed",
      });
    }

    const existingUser = await User.findOne({ employeeId });
    if (!existingUser) {
      return res.status(401).json({
        message: "Login failed",
      });
    }

    const validPassword = await existingUser.comparePassword(password);
    if (!validPassword) {
      return res.status(401).json({
        message: "Login failed",
      });
    }

    const role = ["CEO", "CTO"].includes(employee.position) ? "ADMIN" : "USER";

    const token = jwt.sign({ employeeId: employee.employeeId, role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return res.json({
      token,
      employeeId: employee.employeeId,
      role,
      user: {
        employeeId: employee.employeeId,
        name: employee.name || employee.employeeName || employee.fullName || "Unknown",
        role,
        department: employee.department || employee.company || "General",
        position: employee.position || employee.designation || employee.role || "Employee",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  register,
  login,
};