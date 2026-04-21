const express = require("express");
const { register, login, verifyBiometric } = require("../controllers/auth.controller");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-biometric", verifyBiometric);

module.exports = router;
