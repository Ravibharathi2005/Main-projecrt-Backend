const ToolRequest = require("../models/ToolRequest");
const Session = require("../models/Session");

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

/**
 * Helper: check that the sessionId still maps to an active Session document.
 * This is the core of the session-based revocation logic.
 */
const isSessionStillActive = async (sessionId) => {
  if (!sessionId) return false;
  const session = await Session.findOne({ sessionId, isActive: true });
  return !!session;
};

/**
 * GET /api/tools/requests
 * Admin only: list all tool requests (pending + resolved).
 */
const getRequests = async (req, res) => {
  try {
    const userRole = req.user?.role;
    if (!ADMIN_ROLES.includes(userRole)) {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }

    const requests = await ToolRequest.find()
      .sort({ requestDate: -1 })
      .lean();

    // Annotate each request with live session status so the admin UI can show
    // whether the approved session is still active.
    const enriched = await Promise.all(
      requests.map(async (r) => ({
        ...r,
        sessionActive: await isSessionStillActive(r.sessionId),
      }))
    );

    return res.json({ success: true, requests: enriched });
  } catch (error) {
    console.error("[ToolController] getRequests error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

/**
 * POST /api/tools/request
 * Any authenticated employee: submit a new tool access request.
 * Body: { toolName, toolCategory, sessionId }
 */
const requestAccess = async (req, res) => {
  try {
    const employeeId = req.user?.employeeId;
    const { toolName, toolCategory, sessionId } = req.body;

    if (!toolName || !toolCategory || !sessionId) {
      return res.status(400).json({ success: false, message: "toolName, toolCategory, and sessionId are required." });
    }

    if (!["Cloud", "Office"].includes(toolCategory)) {
      return res.status(400).json({ success: false, message: "Only Cloud and Office tools require approval." });
    }

    // Verify the sessionId belongs to this employee and is active
    const activeSession = await Session.findOne({ sessionId, employeeId, isActive: true });
    if (!activeSession) {
      return res.status(403).json({ success: false, message: "Invalid or expired session. Please re-login." });
    }

    // Check if a pending or approved request already exists for this session + tool
    const existing = await ToolRequest.findOne({
      employeeId,
      toolName,
      sessionId,
      status: { $in: ["Pending", "Approved"] },
    });

    if (existing) {
      const msg = existing.status === "Approved"
        ? "Access already approved for this session."
        : "A pending request already exists for this tool in this session.";
      return res.status(409).json({ success: false, message: msg, status: existing.status });
    }

    const newRequest = await ToolRequest.create({
      employeeId,
      toolName,
      toolCategory,
      sessionId,
    });

    return res.status(201).json({ success: true, message: "Access request submitted.", request: newRequest });
  } catch (error) {
    console.error("[ToolController] requestAccess error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

/**
 * PATCH /api/tools/approve/:id
 * Admin only: approve a tool request.
 */
const approveRequest = async (req, res) => {
  try {
    const userRole = req.user?.role;
    const adminId = req.user?.employeeId;

    if (!ADMIN_ROLES.includes(userRole)) {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }

    const request = await ToolRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }

    if (request.status !== "Pending") {
      return res.status(409).json({ success: false, message: `Request is already ${request.status}.` });
    }

    // Verify the employee's session is still active before approving
    const sessionActive = await isSessionStillActive(request.sessionId);
    if (!sessionActive) {
      return res.status(410).json({
        success: false,
        message: "Cannot approve: the employee's session has expired or they have logged out.",
      });
    }

    request.status = "Approved";
    request.resolvedDate = new Date();
    request.resolvedBy = adminId;
    await request.save();

    return res.json({ success: true, message: `Access to ${request.toolName} approved.`, request });
  } catch (error) {
    console.error("[ToolController] approveRequest error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

/**
 * PATCH /api/tools/reject/:id
 * Admin only: reject a tool request.
 */
const rejectRequest = async (req, res) => {
  try {
    const userRole = req.user?.role;
    const adminId = req.user?.employeeId;

    if (!ADMIN_ROLES.includes(userRole)) {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }

    const request = await ToolRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }

    if (request.status !== "Pending") {
      return res.status(409).json({ success: false, message: `Request is already ${request.status}.` });
    }

    request.status = "Rejected";
    request.resolvedDate = new Date();
    request.resolvedBy = adminId;
    request.adminNote = req.body.adminNote || "";
    await request.save();

    return res.json({ success: true, message: `Access to ${request.toolName} rejected.`, request });
  } catch (error) {
    console.error("[ToolController] rejectRequest error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

/**
 * GET /api/tools/my-access?sessionId=<sid>
 * Returns the list of tool names the current employee has APPROVED access to
 * for their CURRENT session. Approvals from previous (inactive) sessions are excluded.
 *
 * SESSION REVOCATION LOGIC:
 * - Query only approvals matching this employee + this sessionId.
 * - Then verify the session is still active in the Session collection.
 * - If session is dead, return empty array (access effectively revoked).
 */
const getMyAccess = async (req, res) => {
  try {
    const employeeId = req.user?.employeeId;
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.json({ success: true, approvedTools: [] });
    }

    // Confirm session is still alive
    const sessionActive = await isSessionStillActive(sessionId);
    if (!sessionActive) {
      return res.json({ success: true, approvedTools: [], sessionExpired: true });
    }

    // Find all approved requests for this employee in this session
    const approved = await ToolRequest.find({
      employeeId,
      sessionId,
      status: "Approved",
    }).lean();

    const approvedTools = approved.map((r) => r.toolName);

    return res.json({ success: true, approvedTools });
  } catch (error) {
    console.error("[ToolController] getMyAccess error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

module.exports = {
  getRequests,
  requestAccess,
  approveRequest,
  rejectRequest,
  getMyAccess,
};
