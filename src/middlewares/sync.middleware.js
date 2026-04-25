const Session = require("../models/Session");

/**
 * Middleware to verify that the Employee Portal session is still 
 * synchronized with an active Security Website session on the same device.
 */
const validateSecuritySync = async (req, res, next) => {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Generate device ID (Same logic as auth.controller)
    const userAgent = req.get("user-agent") || "unknown";
    const ipAddress = req.ip || "unknown";
    const deviceId = `${ipAddress}-${userAgent.substring(0, 50)}`;

    // Look for active SECURITY session for this device
    const activeSecuritySession = await Session.findOne({
      deviceId,
      appType: "SECURITY",
      isActive: true
    }).sort({ loginTime: -1 });

    if (!activeSecuritySession) {
      return res.status(403).json({
        success: false,
        message: "Active security session required. Please authenticate via the Security Website.",
        securityRequired: true
      });
    }

    if (activeSecuritySession.employeeId !== employeeId) {
      return res.status(403).json({
        success: false,
        message: "Identity mismatch. Session belongs to a different user on this device.",
        sessionMismatch: true
      });
    }

    next();
  } catch (error) {
    console.error("Sync validation error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  validateSecuritySync
};
