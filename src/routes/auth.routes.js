const express = require('express');
const { register, login, verifyBiometric, validateSync } = require("../controllers/auth.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.post("/verify-biometric", verifyBiometric);
router.get("/validate-sync", verifyToken, validateSync);

module.exports = router;
