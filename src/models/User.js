const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    default: "Employee",
  },
  department: {
    type: String,
    default: "General",
  },
  role: {
    type: String,
    enum: [
      "SUPER_ADMIN",
      "ADMIN",
      "HR",
      "MANAGER",
      "SECURITY_ANALYST",
      "EMPLOYEE",
    ],
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  // Trust & Risk Scoring Fields
  trustScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100,
  },
  riskLevel: {
    type: String,
    enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
    default: "LOW",
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  lastLoginTimestamp: {
    type: Date,
    default: null,
  },
  deviceHistory: [
    {
      deviceId: String,
      deviceName: String,
      lastUsed: Date,
      isVerified: {
        type: Boolean,
        default: false,
      },
    },
  ],
  failedLoginAttempts: {
    type: Number,
    default: 0,
  },
  lastFailedLoginTime: {
    type: Date,
    default: null,
  },
  alerts: [
    {
      severity: {
        type: String,
        enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      },
      message: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
      resolved: {
        type: Boolean,
        default: false,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);