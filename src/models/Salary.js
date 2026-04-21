const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
  },
  month: {
    type: String, // e.g., "April 2026"
    required: true,
  },
  basicSalary: {
    type: Number,
    required: true,
  },
  allowances: {
    type: Number,
    default: 0,
  },
  deductions: {
    type: Number,
    default: 0,
  },
  netSalary: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["PAID", "PENDING", "PROCESSED"],
    default: "PAID",
  },
  payDate: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

module.exports = mongoose.model("Salary", salarySchema);
