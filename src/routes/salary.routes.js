const express = require("express");
const router = express.Router();
const salaryController = require("../controllers/salary.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.use(authMiddleware.verifyToken);

router.get("/", salaryController.getSalaries);
router.post("/seed", salaryController.createSampleSalary);

module.exports = router;
