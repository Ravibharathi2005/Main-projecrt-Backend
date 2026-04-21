const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/status", authMiddleware.verifyToken, (req, res) => {
  // 🔥 dummy logic (later AI add pannuvom)
  const score = Math.floor(Math.random() * 100);

  let level = "LOW";
  if (score > 70) level = "HIGH";
  else if (score > 40) level = "MEDIUM";

  res.json({
    score,
    level,
    timestamp: new Date(),
  });
});

module.exports = router;