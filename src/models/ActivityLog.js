const mongoose = require("mongoose");

const ActivityLogSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  action: { type: String, required: true },
  device: { type: String, required: true },
  ip: { type: String, required: true },
  time: { type: Date, default: () => new Date(), required: true },
});

module.exports = mongoose.model("ActivityLog", ActivityLogSchema);
