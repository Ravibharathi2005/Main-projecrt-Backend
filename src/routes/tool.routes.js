const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const { validateSecuritySync } = require("../middlewares/sync.middleware");
const {
  getRequests,
  requestAccess,
  approveRequest,
  rejectRequest,
  getMyAccess,
} = require("../controllers/tool.controller");

// All tool routes require a valid JWT + active security session sync
router.use(verifyToken);
router.use(validateSecuritySync);

// Employee routes
router.get("/my-access", getMyAccess);         // GET  /api/tools/my-access?sessionId=xxx
router.post("/request", requestAccess);         // POST /api/tools/request

// Admin-only routes (role check is inside the controller)
router.get("/requests", getRequests);           // GET  /api/tools/requests
router.patch("/approve/:id", approveRequest);   // PATCH /api/tools/approve/:id
router.patch("/reject/:id", rejectRequest);     // PATCH /api/tools/reject/:id

module.exports = router;
