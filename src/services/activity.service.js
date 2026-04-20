/**
 * Activity Logging Service
 * Records user activities and updates trust scores
 */

const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const riskEngine = require("./riskEngine");

/**
 * Log activity and update trust score
 * @param {string} employeeId - User's employee ID
 * @param {string} activityType - Type of activity (DASHBOARD_VISIT, PROFILE_VISIT, etc)
 * @param {string} description - Activity description
 * @returns {object} - Updated user trust score info
 */
const logUserActivity = async (employeeId, activityType, description = "") => {
  try {
    const user = await User.findOne({ employeeId });
    if (!user) {
      console.warn(`User not found: ${employeeId}`);
      return null;
    }

    // Map activity type to scoring action
    const activityMap = {
      DASHBOARD_VISIT: "DASHBOARD_VISIT",
      PROFILE_VISIT: "PROFILE_VISIT",
      ATTENDANCE_PAGE: "ATTENDANCE_PAGE",
    };

    const scoreAction = activityMap[activityType] || activityType;

    // Update trust score if action is recognized
    if (riskEngine.ACTION_POINTS[scoreAction]) {
      const result = riskEngine.recordActivity({
        currentScore: user.trustScore,
        activityType,
      });

      user.trustScore = result.newScore;
      user.riskLevel = result.riskLevel;

      // Log the activity in ActivityLog collection
      if (ActivityLog) {
        const log = new ActivityLog({
          employeeId,
          activityType,
          description,
          riskLevel: result.riskLevel,
          scoreChange: result.scoreChange,
          newTrustScore: result.newScore,
          timestamp: new Date(),
        });
        await log.save();
      }

      await user.save();

      return {
        trustScore: user.trustScore,
        riskLevel: user.riskLevel,
        scoreChange: result.scoreChange,
      };
    }

    // Activity tracked but no score change
    if (ActivityLog) {
      const log = new ActivityLog({
        employeeId,
        activityType,
        description,
        riskLevel: user.riskLevel,
        scoreChange: 0,
        newTrustScore: user.trustScore,
        timestamp: new Date(),
      });
      await log.save();
    }

    return {
      trustScore: user.trustScore,
      riskLevel: user.riskLevel,
      scoreChange: 0,
    };
  } catch (error) {
    console.error("Error logging activity:", error);
    return null;
  }
};

/**
 * Get user trust score and risk info
 * @param {string} employeeId - User's employee ID
 * @returns {object} - User trust score, risk level, alerts
 */
const getUserTrustInfo = async (employeeId) => {
  try {
    const user = await User.findOne({ employeeId });
    if (!user) {
      return null;
    }

    return {
      trustScore: user.trustScore,
      riskLevel: user.riskLevel,
      lastLogin: user.lastLogin,
      failedAttempts: user.failedLoginAttempts,
      alerts: user.alerts || [],
      deviceCount: user.deviceHistory.length,
    };
  } catch (error) {
    console.error("Error getting trust info:", error);
    return null;
  }
};

/**
 * Get unresolved alerts for user
 * @param {string} employeeId - User's employee ID
 * @returns {array} - Array of unresolved alerts
 */
const getActiveAlerts = async (employeeId) => {
  try {
    const user = await User.findOne({ employeeId });
    if (!user) {
      return [];
    }

    return (user.alerts || []).filter((alert) => !alert.resolved);
  } catch (error) {
    console.error("Error getting alerts:", error);
    return [];
  }
};

/**
 * Mark alert as resolved
 * @param {string} employeeId - User's employee ID
 * @param {string} alertId - Alert ObjectId
 * @returns {boolean}
 */
const resolveAlert = async (employeeId, alertId) => {
  try {
    const user = await User.findOne({ employeeId });
    if (!user) {
      return false;
    }

    const alert = user.alerts.id(alertId);
    if (alert) {
      alert.resolved = true;
      await user.save();
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error resolving alert:", error);
    return false;
  }
};

module.exports = {
  logUserActivity,
  getUserTrustInfo,
  getActiveAlerts,
  resolveAlert,
};
