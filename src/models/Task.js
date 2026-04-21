const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  priority: {
    type: String,
    enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
    default: "LOW",
  },
  status: {
    type: String,
    enum: ["TODO", "IN_PROGRESS", "REVIEW", "DONE"],
    default: "TODO",
  },
  deadline: {
    type: Date,
    required: true,
  },
  category: {
    type: String,
    default: "General",
  }
}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);
