const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendance.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.use(authMiddleware.verifyToken);

router.get("/", attendanceController.getAttendance);
router.post("/check-in", attendanceController.checkIn);
router.post("/check-out", attendanceController.checkOut);

module.exports = router;
