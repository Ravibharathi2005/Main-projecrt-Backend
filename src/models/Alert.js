const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  employeeId: { 
    type: String, 
    required: true,
    index: true
  },
  message: { 
    type: String, 
    required: true 
  },
  severity: { 
    type: String, 
    enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
    default: "LOW",
    index: true
  },
  status: { 
    type: String, 
    enum: ["OPEN", "RESOLVED"],
    default: "OPEN"
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Alert", alertSchema);
