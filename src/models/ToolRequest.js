const mongoose = require("mongoose");

/**
 * ToolRequest Model
 * Stores session-scoped access requests for restricted tools (Cloud & Office).
 *
 * IMPORTANT SESSION-BASED DESIGN:
 * - Approval is tied to a specific sessionId (from the Session collection).
 * - When the employee logs out, the portal session becomes inactive.
 * - getMyAccess controller cross-checks sessionId against the live Session document.
 * - If the Session is no longer active, the approval is treated as expired.
 * - On the next login a new sessionId is generated, so old approvals never carry over.
 */
const toolRequestSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      index: true,
    },
    toolName: {
      type: String,
      required: true,
    },
    toolCategory: {
      type: String,
      required: true,
      enum: ["Cloud", "Office"],
    },
    // The portal sessionId the employee was using when they made the request.
    // Approval is only valid while this session is still active in the Session collection.
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    resolvedDate: {
      type: Date,
    },
    resolvedBy: {
      type: String, // employeeId of the admin who acted
    },
    adminNote: {
      type: String,
    },
  },
  { timestamps: true }
);

// Prevent duplicate pending requests for the same session + tool
toolRequestSchema.index(
  { employeeId: 1, toolName: 1, sessionId: 1, status: 1 },
  { unique: false }
);

module.exports = mongoose.model("ToolRequest", toolRequestSchema);
