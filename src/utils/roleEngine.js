/**
 * Smart Role Assignment Engine
 * Automatically assigns system role based on employee position
 * Uses flexible keyword matching for job titles
 */

const ROLE_MAPPING = {
  SUPER_ADMIN: {
    keywords: ["CEO", "FOUNDER", "PRESIDENT"],
    priority: 100,
  },
  ADMIN: {
    keywords: ["CTO", "IT HEAD", "IT MANAGER", "SECURITY HEAD", "CHIEF"],
    priority: 90,
  },
  HR: {
    keywords: ["HR MANAGER", "HR EXECUTIVE", "HUMAN RESOURCES", "RECRUITER"],
    priority: 80,
  },
  MANAGER: {
    keywords: ["TEAM LEAD", "PROJECT MANAGER", "MANAGER", "SUPERVISOR"],
    priority: 70,
  },
  SECURITY_ANALYST: {
    keywords: ["SECURITY OFFICER", "SOC ANALYST", "SECURITY ANALYST", "ANALYST"],
    priority: 60,
  },
  EMPLOYEE: {
    keywords: ["DEVELOPER", "ENGINEER", "TESTER", "DESIGNER", "CONSULTANT", "ASSOCIATE"],
    priority: 50,
  },
};

/**
 * Determine role based on job position
 * Uses keyword matching to find best role fit
 *
 * @param {string} position - Employee's job position/title
 * @returns {string} - Assigned role (default: EMPLOYEE)
 */
const assignRole = (position) => {
  if (!position || typeof position !== "string") {
    return "EMPLOYEE";
  }

  const positionUpper = position.toUpperCase().trim();

  // Collect matching roles with their priorities
  const matches = [];

  Object.entries(ROLE_MAPPING).forEach(([role, config]) => {
    config.keywords.forEach((keyword) => {
      if (positionUpper.includes(keyword)) {
        matches.push({
          role,
          priority: config.priority,
          exactMatch: positionUpper === keyword,
        });
      }
    });
  });

  // Sort by exact match first, then by priority
  matches.sort((a, b) => {
    if (a.exactMatch !== b.exactMatch) {
      return b.exactMatch - a.exactMatch;
    }
    return b.priority - a.priority;
  });

  // Return highest priority match
  return matches.length > 0 ? matches[0].role : "EMPLOYEE";
};

/**
 * Get all available roles for the system
 * @returns {string[]} - Array of all valid roles
 */
const getAllRoles = () => {
  return Object.keys(ROLE_MAPPING);
};

/**
 * Check if a role is valid
 * @param {string} role - Role to validate
 * @returns {boolean}
 */
const isValidRole = (role) => {
  return getAllRoles().includes(role);
};

module.exports = {
  assignRole,
  getAllRoles,
  isValidRole,
  ROLE_MAPPING,
};
