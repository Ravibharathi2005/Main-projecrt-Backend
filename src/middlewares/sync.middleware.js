const Session = require("../models/Session");

/**
 * Middleware to verify that the Employee Portal session is still
 * synchronized with an active Security Website OR Company Portal session.
 *
 * Priority:
 *   1. Active SECURITY session (exact deviceId match)
 *   2. Active COMPANY session  (exact deviceId match)
 *   3. Any active SECURITY or COMPANY session for this employee (deviceId-agnostic fallback)
 *      — handles IP normalisation differences between login and API requests
 *   4. No valid session → 403
 */
const validateSecuritySync = async (req, res, next) => {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userAgent = req.get("user-agent") || "unknown";
    const ipAddress = req.ip || "unknown";
    const deviceId = `${ipAddress}-${userAgent.substring(0, 50)}`;

    // Check 1 & 2: Exact deviceId match (SECURITY or COMPANY)
    const exactSession = await Session.findOne({
      deviceId,
      employeeId,
      appType: { $in: ["SECURITY", "COMPANY"] },
      isActive: true,
    }).sort({ loginTime: -1 });

    if (exactSession) {
      return next();
    }

    // Check 3: Fallback — any active session for this employee regardless of deviceId.
    // Handles cases where the IP or user-agent substring differs slightly between
    // the login request and the API request (e.g. IPv4 vs IPv6 normalisation).
    const fallbackSession = await Session.findOne({
      employeeId,
      appType: { $in: ["SECURITY", "COMPANY"] },
      isActive: true,
    }).sort({ loginTime: -1 });

    if (fallbackSession) {
      console.log(`[SyncMiddleware] deviceId mismatch for ${employeeId} — fallback session accepted (${fallbackSession.appType})`);
      return next();
    }

    // No valid session at all
    return res.status(403).json({
      success: false,
      message: "Active session required. Please authenticate via the Security Website.",
      securityRequired: true,
    });

  } catch (error) {
    console.error("[SyncMiddleware] Error:", error);
    // Fail-open on internal errors so a DB blip doesn't lock out all employees.
    // The JWT (verifyToken) is still the primary authentication gate.
    return next();
  }
};

module.exports = { validateSecuritySync };
