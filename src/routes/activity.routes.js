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

    let risk = "LOW";
    if (action.toLowerCase().includes("restricted") || action.toLowerCase().includes("attempt")) risk = "HIGH";

    console.log("Activity saved:", activity);
    return res.json({ message: "Activity logged", risk });
  } catch (error) {
    console.error("Failed to log activity", error);
    return res.status(500).json({ message: "Unable to save activity" });
  }
});

router.get("/", async (req, res) => {
  const { employeeId, startDate, endDate, action, risk, page = 1, limit = 50 } = req.query;

  try {
    const query = {};

    if (employeeId) query.employeeId = employeeId;
    if (action) query.action = { $regex: action, $options: "i" };
    if (risk) query.risk = risk;

    if (startDate || endDate) {
      query.time = {};
      if (startDate) query.time.$gte = new Date(startDate);
      if (endDate) query.time.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const activities = await ActivityLog.find(query)
      .sort({ time: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("employeeId", "name email");

    const total = await ActivityLog.countDocuments(query);

    return res.json({
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Cannot fetch activities", error);
    return res.status(500).json({ message: "Unable to fetch activities" });
  }
});

module.exports = router;