/**
 * Authentication Middleware
 * Validates JWT tokens and checks role-based access
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";

/**
 * Verify JWT token and attach user to request
 */
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

/**
 * Check if user has required role
 * @param {array} allowedRoles - Array of allowed roles
 */
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role;

      if (!userRole || !allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions for this action",
        });
      }

      next();
    } catch (error) {
      return res.status(403).json({
        success: false,
        message: "Authorization check failed",
      });
    }
  };
};

/**
 * Check if user's trust score is acceptable
 * Blocks users with CRITICAL risk level
 */
const checkTrustScore = async (req, res, next) => {
  try {
    const employeeId = req.user?.employeeId;

    if (!employeeId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token",
      });
    }

    const user = await User.findOne({ employeeId });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Block access for CRITICAL risk level
    if (user.riskLevel === "CRITICAL") {
      return res.status(403).json({
        success: false,
        message: "Access denied due to critical security risk",
        riskLevel: user.riskLevel,
      });
    }

    // Attach user info to request for downstream use
    req.userInfo = {
      employeeId: user.employeeId,
      role: user.role,
      trustScore: user.trustScore,
      riskLevel: user.riskLevel,
    };

    next();
  } catch (error) {
    console.error("Trust score check error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Require admin/super admin role
 */
const requireAdmin = authorizeRole(["ADMIN", "SUPER_ADMIN"]);

/**
 * Require super admin role only
 */
const requireSuperAdmin = authorizeRole(["SUPER_ADMIN"]);

module.exports = {
  verifyToken,
  authorizeRole,
  checkTrustScore,
  requireAdmin,
  requireSuperAdmin,
};
