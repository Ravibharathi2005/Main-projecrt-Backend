const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  employeeId: { 
    type: String, 
    required: true,
    index: true
  },
  action: { type: String }, // Backward compatibility
  activityType: { type: String }, // Modern tracking
  description: { type: String },
  device: { type: String, required: true },
  ip: { type: String, required: true },
  riskLevel: { 
    type: String, 
    enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
    default: "LOW"
  },
  scoreChange: { type: Number, default: 0 },
  newTrustScore: { type: Number },
  time: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
