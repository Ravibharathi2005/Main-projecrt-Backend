/**
 * Risk Scoring & Suspicious Behavior Engine
 * Evaluates user behavior and assigns dynamic risk scores
 * All users start with trust score = 100
 */

// Risk Level definitions
const RISK_LEVELS = {
  LOW: { min: 80, max: 100, label: "Low" },
  MEDIUM: { min: 50, max: 79, label: "Medium" },
  HIGH: { min: 20, max: 49, label: "High" },
  CRITICAL: { min: 0, max: 19, label: "Critical" },
};

// Action points (positive actions add, suspicious actions subtract)
const ACTION_POINTS = {
  // Normal, trustworthy actions (positive)
  DASHBOARD_VISIT: 1,
  PROFILE_VISIT: 1,
  ATTENDANCE_PAGE: 1,

  // Suspicious actions (negative)
  FAILED_LOGIN: -10,
  UNAUTHORIZED_ADMIN_ACCESS: -20,
  RAPID_CLICKS: -10,
  MULTIPLE_FAILED_ATTEMPTS: -15,
  UNKNOWN_DEVICE: -20,
  MIDNIGHT_LOGIN: -15,
  SUSPICIOUS_API_CALL: -25,
};

const INITIAL_SCORE = 100;

/**
 * Get risk level based on trust score
 * @param {number} score - Trust score (0-100)
 * @returns {string} - Risk level (LOW, MEDIUM, HIGH, CRITICAL)
 */
const getRiskLevel = (score) => {
  if (score >= RISK_LEVELS.LOW.min) return "LOW";
  if (score >= RISK_LEVELS.MEDIUM.min) return "MEDIUM";
  if (score >= RISK_LEVELS.HIGH.min) return "HIGH";
  return "CRITICAL";
};

/**
 * Calculate updated trust score based on action
 * @param {number} currentScore - Current trust score
 * @param {string} action - Action type (from ACTION_POINTS)
 * @param {object} context - Additional context for calculation
 * @returns {number} - Updated trust score (clamped 0-100)
 */
const updateScore = (currentScore, action, context = {}) => {
  if (!ACTION_POINTS.hasOwnProperty(action)) {
    console.warn(`Unknown action: ${action}`);
    return currentScore;
  }

  let updatedScore = currentScore + ACTION_POINTS[action];

  // Special case: Multiple failed attempts with multiplier
  if (action === "MULTIPLE_FAILED_ATTEMPTS" && context.attemptCount) {
    const multiplier = Math.min(context.attemptCount * 0.5, 2);
    updatedScore = currentScore + ACTION_POINTS[action] * multiplier;
  }

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, updatedScore));
};

/**
 * Check if login is at unusual time (midnight hours)
 * @param {Date} timestamp - Login timestamp
 * @returns {boolean}
 */
const isMidnightLogin = (timestamp) => {
  const hour = new Date(timestamp).getHours();
  // Consider 9 PM to 6 AM as unusual
  return hour >= 21 || hour < 6;
};

/**
 * Check if device is known
 * @param {string} deviceId - Device fingerprint/ID
 * @param {array} deviceHistory - Array of previous device IDs
 * @returns {boolean}
 */
const isKnownDevice = (deviceId, deviceHistory = []) => {
  if (!deviceHistory || deviceHistory.length === 0) return false;
  return deviceHistory.includes(deviceId);
};

/**
 * Comprehensive login risk analysis
 * Called during login to assess risk and return score adjustments
 *
 * @param {object} loginData - Login context
 * @returns {object} - { scoreAdjustments: [], newScore, riskLevel, alerts }
 */
const analyzeLoginRisk = (loginData) => {
  const {
    currentScore = INITIAL_SCORE,
    failedAttempts = 0,
    deviceId,
    deviceHistory = [],
    loginTime,
    position,
  } = loginData;

  const scoreAdjustments = [];
  let newScore = currentScore;

  // Failed login attempts
  if (failedAttempts > 0) {
    scoreAdjustments.push({
      action: "MULTIPLE_FAILED_ATTEMPTS",
      points: ACTION_POINTS.MULTIPLE_FAILED_ATTEMPTS,
      reason: `${failedAttempts} failed login attempts`,
    });
    newScore = updateScore(newScore, "MULTIPLE_FAILED_ATTEMPTS", {
      attemptCount: failedAttempts,
    });
  }

  // Unknown device
  if (deviceId && !isKnownDevice(deviceId, deviceHistory)) {
    scoreAdjustments.push({
      action: "UNKNOWN_DEVICE",
      points: ACTION_POINTS.UNKNOWN_DEVICE,
      reason: "Login from unknown device",
    });
    newScore = updateScore(newScore, "UNKNOWN_DEVICE");
  }

  // Midnight/unusual time login
  if (loginTime && isMidnightLogin(loginTime)) {
    scoreAdjustments.push({
      action: "MIDNIGHT_LOGIN",
      points: ACTION_POINTS.MIDNIGHT_LOGIN,
      reason: "Unusual login time (outside business hours)",
    });
    newScore = updateScore(newScore, "MIDNIGHT_LOGIN");
  }

  const riskLevel = getRiskLevel(newScore);

  // Generate alerts for HIGH and CRITICAL risks
  const alerts = [];
  if (riskLevel === "HIGH" || riskLevel === "CRITICAL") {
    alerts.push({
      severity: riskLevel,
      message: `User risk level is ${riskLevel}`,
      timestamp: new Date(),
      recommendations: getRecommendations(riskLevel, scoreAdjustments),
    });
  }

  return {
    scoreAdjustments,
    newScore,
    riskLevel,
    alerts,
  };
};

/**
 * Get recommendations based on risk level and actions
 * @param {string} riskLevel - Current risk level
 * @param {array} scoreAdjustments - Recent score adjustments
 * @returns {string[]}
 */
const getRecommendations = (riskLevel, scoreAdjustments = []) => {
  const recommendations = [];

  if (riskLevel === "CRITICAL") {
    recommendations.push("Require multi-factor authentication");
    recommendations.push("Consider account suspension review");
    recommendations.push("Notify user of unusual activity");
  } else if (riskLevel === "HIGH") {
    recommendations.push("Enable additional verification");
    recommendations.push("Monitor next 24 hours closely");
  }

  // Action-specific recommendations
  scoreAdjustments.forEach((adj) => {
    if (adj.action === "UNKNOWN_DEVICE") {
      recommendations.push("Verify device registration");
    }
    if (adj.action === "MIDNIGHT_LOGIN") {
      recommendations.push("Confirm business necessity of after-hours access");
    }
    if (adj.action === "MULTIPLE_FAILED_ATTEMPTS") {
      recommendations.push("Check for credential compromise");
    }
  });

  return [...new Set(recommendations)]; // Remove duplicates
};

/**
 * Record user activity and update score
 * Called for normal user actions (page visits, etc)
 *
 * @param {object} activityData - Activity context
 * @returns {object} - { scoreChange, newScore, riskLevel }
 */
const recordActivity = (activityData) => {
  const { currentScore = INITIAL_SCORE, activityType } = activityData;

  // Map activity to action points if available
  const actionKey = `${activityType.toUpperCase()}_VISIT`;
  if (!ACTION_POINTS.hasOwnProperty(actionKey)) {
    return {
      scoreChange: 0,
      newScore: currentScore,
      riskLevel: getRiskLevel(currentScore),
    };
  }

  const scoreChange = ACTION_POINTS[actionKey];
  const newScore = updateScore(currentScore, actionKey);
  const riskLevel = getRiskLevel(newScore);

  return {
    scoreChange,
    newScore,
    riskLevel,
  };
};

module.exports = {
  INITIAL_SCORE,
  ACTION_POINTS,
  RISK_LEVELS,
  getRiskLevel,
  updateScore,
  isMidnightLogin,
  isKnownDevice,
  analyzeLoginRisk,
  recordActivity,
  getRecommendations,
};
