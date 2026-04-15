const express = require("express");
const { register } = require("../controllers/auth.controller");
const router = express.Router();

router.post("/register", register);

router.post("/login", (req, res) => {
  const { employeeId, password } = req.body;

  console.log("Login attempt:", employeeId, password);

  if (employeeId === "admin") {
    return res.json({
      token: "admin-token",
      role: "ADMIN",
    });
  }

  return res.json({
    token: "user-token",
    role: "USER",
  });
});

module.exports = router;