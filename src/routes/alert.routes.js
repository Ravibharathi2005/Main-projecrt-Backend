const express = require("express");
const router = express.Router();
const Alert = require("../models/Alert");

// ➤ Generate alert
router.post("/create", async (req, res) => {
  const { employeeId, message, level } = req.body;

  try {
    const alert = new Alert({
      employeeId,
      message,
      severity: level || "LOW",
    });

    await alert.save();
    console.log("🚨 ALERT Saved to DB:", alert);

    res.json({ success: true, message: "Alert created", data: alert });
  } catch (error) {
    console.error("Error creating alert:", error);
    res.status(500).json({ success: false, message: "Failed to create alert" });
  }
});

// ➤ Get all alerts
router.get("/", async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ timestamp: -1 });
    res.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ message: "Failed to fetch alerts" });
  }
});

module.exports = router;