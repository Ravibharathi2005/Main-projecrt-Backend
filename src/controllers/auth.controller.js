const jwt = require("jsonwebtoken");
const User = require("../models/User");
const CompanyEmployee = require("../models/CompanyEmployee");
const roleEngine = require("../utils/roleEngine");
const riskEngine = require("../utils/riskEngine");
const Alert = require("../models/Alert");
const Session = require("../models/Session");
const crypto = require("crypto");

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
    const { employeeId: rawId, password, biometricData } = req.body;
    const employeeId = rawId ? rawId.toUpperCase() : null;
    console.log(`[REGISTRATION ATTEMPT] UID: ${employeeId}`);

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
      console.warn(`[REGISTRATION FAILED] Invalid Employee ID: ${employeeId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid Employee ID",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ employeeId });
    if (existingUser) {
      console.warn(`[REGISTRATION FAILED] User already registered: ${employeeId}`);
      return res.status(400).json({
        success: false,
        message: "User already registered",
      });
    }

    let facialTemplateStr = null;
    if (biometricData) {
      try {
        const response = await fetch("http://127.0.0.1:5050/api/face/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: biometricData })
        });
        
        const rawText = await response.text();
        let aiData;
        try {
          aiData = JSON.parse(rawText);
        } catch (parseError) {
          console.error("AI Service returned non-JSON:", rawText.substring(0, 100));
          return res.status(500).json({
            success: false,
            message: "Biometric AI service returned invalid response"
          });
        }
        
        if (!response.ok || !aiData.success) {
          return res.status(400).json({
            success: false,
            message: aiData.message || "Failed to extract face biometrics"
          });
        }
        
        facialTemplateStr = JSON.stringify(aiData.embedding);
      } catch (err) {
        console.error("AI Service Error:", err);
        return res.status(500).json({
          success: false,
          message: "Biometric AI service is offline"
        });
      }
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
      facialTemplate: facialTemplateStr,
      isBiometricEnrolled: !!facialTemplateStr,
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

// Login with Multi-Factor Biometric Status
const login = async (req, res) => {
  try {
    const { employeeId: rawId, password, appType } = req.body;
    const employeeId = rawId ? rawId.toUpperCase() : null;

    if (!employeeId || !password) {
      return res.status(401).json({ message: "Login failed" });
    }

    const deviceId = generateDeviceId(req);

    // [SYNC ENFORCEMENT] If logging into COMPANY PORTAL, verify SECURITY session is active on this device
    if (appType === "COMPANY") {
      const activeSecuritySession = await Session.findOne({
        deviceId,
        employeeId, // Strict match: Ensure we grab THIS user's active security session
        appType: "SECURITY",
        isActive: true
      }).sort({ loginTime: -1 });

      if (!activeSecuritySession) {
        return res.status(403).json({ 
          message: "Secure session required. Please authenticate via the Security Website first.",
          securityRequired: true
        });
      }

      // the below check is mostly redundant now, but kept for absolute logical safety
      if (activeSecuritySession.employeeId !== employeeId) {
        return res.status(403).json({ 
          message: `Identity mismatch. Only the user logged into the Security Website (${activeSecuritySession.employeeId}) can access this device's portal.`,
          sessionMismatch: true
        });
      }
    }

    const employee = await CompanyEmployee.findOne({ employeeId });
    if (!employee) {
      return res.status(401).json({ message: "Login failed" });
    }

    let existingUser = await User.findOne({ employeeId });
    if (!existingUser) {
      return res.status(401).json({ message: "Login failed" });
    }

    // Validate password
    const validPassword = await existingUser.comparePassword(password);
    if (!validPassword) {
      existingUser.failedLoginAttempts = (existingUser.failedLoginAttempts || 0) + 1;
      existingUser.lastFailedLoginTime = new Date();

      const riskAnalysis = riskEngine.analyzeLoginRisk({
        currentScore: existingUser.trustScore,
        failedAttempts: existingUser.failedLoginAttempts,
      });

      existingUser.trustScore = riskAnalysis.newScore;
      existingUser.riskLevel = riskAnalysis.riskLevel;

      if (riskAnalysis.alerts.length > 0) {
        existingUser.alerts.push(...riskAnalysis.alerts);
      }

      await existingUser.save();

      // Log Security Alert for failed login
      await new Alert({
        employeeId: existingUser.employeeId,
        message: `Failed login attempt for account ${existingUser.employeeId}`,
        severity: "MEDIUM",
        metadata: { ip: req.ip, deviceId }
      }).save();

      return res.status(401).json({ message: "Login failed" });
    }

    // Analyze risk
    const riskAnalysis = riskEngine.analyzeLoginRisk({
      currentScore: existingUser.trustScore,
      failedAttempts: existingUser.failedLoginAttempts,
      deviceId,
      deviceHistory: existingUser.deviceHistory.map((d) => d.deviceId),
      loginTime: new Date(),
      position: existingUser.position,
    });

    existingUser.trustScore = riskAnalysis.newScore;
    existingUser.riskLevel = riskAnalysis.riskLevel;
    existingUser.lastLogin = new Date();
    existingUser.failedLoginAttempts = 0;

    await addDeviceToHistory(existingUser, deviceId);

    if (riskAnalysis.alerts.length > 0) {
      existingUser.alerts.push(...riskAnalysis.alerts);
    }

    const assignedRole = roleEngine.assignRole(employee.position);
    existingUser.role = assignedRole;
    await existingUser.save();

    // ===== PASSWORD SUCCESS - CHECK BIOMETRIC MFA =====
    if (existingUser.isBiometricEnrolled) {
      return res.json({
        success: true,
        mfaRequired: true,
        mfaType: "BIOMETRIC",
        employeeId: existingUser.employeeId,
        message: "Password verified. Biometric handshake required."
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { employeeId: existingUser.employeeId, role: existingUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Create Session record
    const sessionId = crypto.randomBytes(16).toString("hex");
    await new Session({
      employeeId: existingUser.employeeId,
      sessionId,
      deviceId,
      ip: req.ip,
      isActive: true,
      appType: appType || "SECURITY" // Default to SECURITY if not specified
    }).save();

    return res.json({
      token,
      sessionId, // Return sessionId to client
      employeeId: existingUser.employeeId,
      role: existingUser.role,
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
    res.status(500).json({ message: "Internal server error" });
  }
};

// Verify biometric data to complete MFA login
const verifyBiometric = async (req, res) => {
  try {
    const { employeeId: rawId, biometricData, appType } = req.body;
    const employeeId = rawId ? rawId.toUpperCase() : null;

    if (!employeeId || !biometricData) {
      return res.status(400).json({ message: "Biometric verification failed" });
    }

    const user = await User.findOne({ employeeId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.facialTemplate) {
      return res.status(400).json({ success: false, message: "User has no registered face data" });
    }

    let isMatch = false;
    let distance = 1.0;

    try {
      const storedEmbedding = JSON.parse(user.facialTemplate);
      const response = await fetch("http://127.0.0.1:5050/api/face/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          image: biometricData,
          stored_embedding: storedEmbedding
        })
      });
      
      const rawText = await response.text();
      let aiData;
      try {
        aiData = JSON.parse(rawText);
      } catch (parseError) {
        console.error("AI Service returned non-JSON:", rawText.substring(0, 100));
        return res.status(500).json({ success: false, message: "Biometric AI service returned invalid response" });
      }

      if (!response.ok || !aiData.success) {
        return res.status(400).json({
          success: false,
          message: aiData.message || "Face verification failed"
        });
      }

      isMatch = aiData.match;
      distance = aiData.distance;
    } catch (err) {
      console.error("AI Service Error:", err);
      return res.status(500).json({ success: false, message: "Biometric AI service is offline" });
    }

    if (!isMatch) {
      console.warn(`[SECURITY] Biometric Mismatch for UID: ${employeeId} (Distance: ${distance.toFixed(4)})`);
      user.trustScore = Math.max(0, user.trustScore - 15);
      user.riskLevel = user.trustScore < 40 ? "HIGH" : "MEDIUM";
      user.alerts.push({
        severity: "HIGH",
        message: `Biometric Handshake Failed (Mismatch Δ: ${distance.toFixed(4)})`,
      });
      await user.save();

      // Log Security Alert for biometric mismatch
      await new Alert({
        employeeId: user.employeeId,
        message: `Biometric identity mismatch for UID: ${employeeId}`,
        severity: "HIGH",
        metadata: { variance: distance.toFixed(4), ip: req.ip }
      }).save();

      return res.status(401).json({ success: false, message: "Biometric Identity Match Failed" });
    }

    console.log(`[SECURITY] Biometric Handshake Successful for UID: ${employeeId}`);

    const token = jwt.sign(
      { employeeId: user.employeeId, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Create Session record
    const sessionId = crypto.randomBytes(16).toString("hex");
    const deviceId = `${req.ip}-${(req.get("user-agent") || "unknown").substring(0, 50)}`;
    await new Session({
      employeeId: user.employeeId,
      sessionId,
      deviceId,
      ip: req.ip,
      isActive: true,
      appType: appType || "SECURITY"
    }).save();

    return res.json({
      success: true,
      token,
      sessionId, // Return sessionId to client
      employeeId: user.employeeId,
      role: user.role,
      user: {
        employeeId: user.employeeId,
        name: user.name,
        role: user.role,
        department: user.department,
        position: user.position,
        trustScore: user.trustScore,
        riskLevel: user.riskLevel,
      },
    });
  } catch (error) {
    console.error("Biometric verification error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Real-time synchronization check for Employee Portal
const validateSync = async (req, res) => {
  try {
    const { employeeId } = req.user;
    
    // Generate device ID
    const userAgent = req.get("user-agent") || "unknown";
    const ipAddress = req.ip || "unknown";
    const deviceId = `${ipAddress}-${userAgent.substring(0, 50)}`;

    const activeSecuritySession = await Session.findOne({
      deviceId,
      appType: "SECURITY",
      isActive: true
    }).sort({ loginTime: -1 });

    if (!activeSecuritySession || activeSecuritySession.employeeId !== employeeId) {
      return res.status(403).json({
        success: false,
        message: "Synchronized session invalid or terminated."
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

module.exports = {
  register,
  login,
  verifyBiometric,
  validateSync,
};