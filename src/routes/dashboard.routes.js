const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/", authMiddleware.verifyToken, (req, res) => {
  res.json({
    riskStatus: "Low Risk ✅",
    sessions: 1,
    alerts: 0,
    activities: [
      "Logged in successfully",
      "Viewed dashboard",
      "No suspicious activity detected",
    ],
  });
});

module.exports = router;