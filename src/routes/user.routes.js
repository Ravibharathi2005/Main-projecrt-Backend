const express = require("express");
const { getEmployeeProfile, getDashboardStats } = require("../controllers/user.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { validateSecuritySync } = require("../middlewares/sync.middleware");
const router = express.Router();

// GET employee profile from the master CompanyEmployee dataset
router.get("/profile/:employeeId", verifyToken, validateSecuritySync, getEmployeeProfile);
router.get("/stats", verifyToken, validateSecuritySync, getDashboardStats);

module.exports = router;
