const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  employeeId: { 
    type: String, 
    required: true,
    index: true
  },
  sessionId: { 
    type: String, 
    unique: true,
    index: true
  },
  deviceId: { 
    type: String 
  },
  ip: { 
    type: String 
  },
  loginTime: { 
    type: Date, 
    default: Date.now 
  },
  lastSeen: { 
    type: Date, 
    default: Date.now 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  appType: {
    type: String,
    enum: ["SECURITY", "COMPANY"],
    required: true,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

// Compound index for real-time device session validation
sessionSchema.index({ deviceId: 1, appType: 1, isActive: 1 });

module.exports = mongoose.model("Session", sessionSchema);
