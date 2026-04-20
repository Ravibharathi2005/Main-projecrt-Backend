const jwt = require("jsonwebtoken");
const User = require("../models/User");
const CompanyEmployee = require("../models/CompanyEmployee");
const roleEngine = require("../utils/roleEngine");
const riskEngine = require("../utils/riskEngine");

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";
const JWT_EXPIRES_IN = "1h";

/**
 * Generate simple device ID fingerprint (in production, use more sophisticated method)
 */
const generateDeviceId = (req) => {
  const userAgent = req.get("user-agent") || "unknown";
  const ipAddress = req.ip || "unknown";
  return `${ipAddress}-${userAgent.substring(0, 50)}`;
};

/**
 * Add device to user's device history
 */
const addDeviceToHistory = async (user, deviceId, deviceName = "Unknown") => {
  const existingDevice = user.deviceHistory.find((d) => d.deviceId === deviceId);

  if (!existingDevice) {
    user.deviceHistory.push({
      deviceId,
      deviceName,
      lastUsed: new Date(),
      isVerified: false,
    });
  } else {
    existingDevice.lastUsed = new Date();
  }

  await user.save();
};

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

    // Use Smart Role Engine for role assignment
    const role = roleEngine.assignRole(employee.position);

    // Create new user
    const newUser = new User({
      employeeId,
      name: employee.name,
      company: employee.company,
      position: employee.position,
      department: employee.department || "General",
      role,
      password,
      trustScore: riskEngine.INITIAL_SCORE,
      riskLevel: "LOW",
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      role: newUser.role,
      trustScore: newUser.trustScore,
      riskLevel: newUser.riskLevel,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Login using companyemployees master data with Risk Scoring & Role Assignment
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

    let existingUser = await User.findOne({ employeeId });
    if (!existingUser) {
      return res.status(401).json({
        message: "Login failed",
      });
    }

    // Validate password
    const validPassword = await existingUser.comparePassword(password);
    if (!validPassword) {
      // Update failed login attempts
      existingUser.failedLoginAttempts =
        (existingUser.failedLoginAttempts || 0) + 1;
      existingUser.lastFailedLoginTime = new Date();

      // Calculate risk adjustment for failed login
      const riskAnalysis = riskEngine.analyzeLoginRisk({
        currentScore: existingUser.trustScore,
        failedAttempts: existingUser.failedLoginAttempts,
      });

      existingUser.trustScore = riskAnalysis.newScore;
      existingUser.riskLevel = riskAnalysis.riskLevel;

      // Add alert if HIGH or CRITICAL
      if (riskAnalysis.alerts.length > 0) {
        existingUser.alerts.push(...riskAnalysis.alerts);
      }

      await existingUser.save();

      return res.status(401).json({
        message: "Login failed",
      });
    }

    // ===== LOGIN SUCCESSFUL - PERFORM RISK ANALYSIS =====

    // Generate device ID
    const deviceId = generateDeviceId(req);

    // Check if device is known
    const isKnownDevice = riskEngine.isKnownDevice(
      deviceId,
      existingUser.deviceHistory.map((d) => d.deviceId)
    );

    // Comprehensive risk analysis
    const riskAnalysis = riskEngine.analyzeLoginRisk({
      currentScore: existingUser.trustScore,
      failedAttempts: existingUser.failedLoginAttempts,
      deviceId,
      deviceHistory: existingUser.deviceHistory.map((d) => d.deviceId),
      loginTime: new Date(),
      position: existingUser.position,
    });

    // Update user trust & risk
    existingUser.trustScore = riskAnalysis.newScore;
    existingUser.riskLevel = riskAnalysis.riskLevel;
    existingUser.lastLogin = new Date();
    existingUser.lastLoginTimestamp = new Date();
    existingUser.failedLoginAttempts = 0; // Reset on successful login
    existingUser.lastFailedLoginTime = null;

    // Add device to history if new
    if (!isKnownDevice) {
      existingUser.deviceHistory.push({
        deviceId,
        deviceName: "Recent Device",
        lastUsed: new Date(),
        isVerified: false,
      });
    } else {
      // Update last used time
      const device = existingUser.deviceHistory.find(
        (d) => d.deviceId === deviceId
      );
      if (device) {
        device.lastUsed = new Date();
      }
    }

    // Add alerts if necessary
    if (riskAnalysis.alerts.length > 0) {
      existingUser.alerts.push(...riskAnalysis.alerts);
    }

    // Auto-assign role based on employee position (Smart Role Engine)
    const assignedRole = roleEngine.assignRole(employee.position);
    existingUser.role = assignedRole;

    // Save updated user
    await existingUser.save();

    // Generate JWT token with updated role
    const token = jwt.sign(
      {
        employeeId: existingUser.employeeId,
        role: existingUser.role,
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
      }
    );

    return res.json({
      token,
      employeeId: existingUser.employeeId,
      role: existingUser.role,
      trustScore: existingUser.trustScore,
      riskLevel: existingUser.riskLevel,
      alerts: riskAnalysis.alerts,
      user: {
        employeeId: existingUser.employeeId,
        name: existingUser.name,
        role: existingUser.role,
        department: existingUser.department,
        position: existingUser.position,
        trustScore: existingUser.trustScore,
        riskLevel: existingUser.riskLevel,
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