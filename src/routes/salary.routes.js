const express = require("express");
const router = express.Router();
const salaryController = require("../controllers/salary.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { validateSecuritySync } = require("../middlewares/sync.middleware");

router.use(authMiddleware.verifyToken);
router.use(validateSecuritySync);

router.get("/", salaryController.getSalaries);
router.post("/seed", salaryController.createSampleSalary);

module.exports = router;
