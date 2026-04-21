const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  checkIn: {
    type: Date,
    required: true,
  },
  checkOut: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ["PRESENT", "ABSENT", "LATE", "HALF_DAY"],
    default: "PRESENT",
  },
  location: {
    type: String,
    default: "Office",
  },
  workHours: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
