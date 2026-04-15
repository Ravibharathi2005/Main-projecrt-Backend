const express = require("express");
const router = express.Router();

let alerts = [];

// ➤ Generate alert
router.post("/create", (req, res) => {
  const { employeeId, message, level } = req.body;

  const alert = {
    employeeId,
    message,
    level, // LOW / MEDIUM / HIGH
    time: new Date(),
  };

  alerts.push(alert);

  console.log("🚨 ALERT:", alert);

  res.json({ message: "Alert created" });
});

// ➤ Get all alerts
router.get("/", (req, res) => {
  res.json(alerts);
});

module.exports = router;