const express = require("express");
const router = express.Router();
const ActivityLog = require("../models/ActivityLog");

router.post("/", async (req, res) => {
  const { employeeId, action, device } = req.body;
  const ip = (req.headers["x-forwarded-for"] || req.ip || "unknown").split(",")[0].trim();

  if (!employeeId || !action) {
    return res.status(400).json({ message: "employeeId and action are required" });
  }

  try {
    const activity = new ActivityLog({
      employeeId,
      action,
      device: device || req.headers["user-agent"] || "unknown",
      ip,
    });

    await activity.save();

    // Optional risk-flagging helpers
    const lastMinuteCount = await ActivityLog.countDocuments({
      employeeId,
      time: { $gt: new Date(Date.now() - 60 * 1000) },
    });

    let risk = "LOW";
    if (lastMinuteCount > 8) risk = "HIGH";
    if (action.toLowerCase().includes("restricted") || action.toLowerCase().includes("attempt")) risk = "HIGH";

    console.log("Activity saved:", activity);
    return res.json({ message: "Activity logged", risk });
  } catch (error) {
    console.error("Failed to log activity", error);
    return res.status(500).json({ message: "Unable to save activity" });
  }
});

router.get("/", async (req, res) => {
  const { employeeId } = req.query;

  try {
    const query = {};
    if (employeeId) query.employeeId = employeeId;

    const activities = await ActivityLog.find(query).sort({ time: -1 }).limit(1000);
    return res.json(activities);
  } catch (error) {
    console.error("Cannot fetch activities", error);
    return res.status(500).json({ message: "Unable to fetch activities" });
  }
});

module.exports = router;