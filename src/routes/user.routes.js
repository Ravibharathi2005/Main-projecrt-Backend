const express = require("express");
const { getEmployeeProfile, getDashboardStats } = require("../controllers/user.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const router = express.Router();

// GET employee profile from the master CompanyEmployee dataset
router.get("/profile/:employeeId", verifyToken, getEmployeeProfile);
router.get("/stats", verifyToken, getDashboardStats);

module.exports = router;
