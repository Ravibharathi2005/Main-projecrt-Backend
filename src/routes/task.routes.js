const express = require("express");
const router = express.Router();
const taskController = require("../controllers/task.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { validateSecuritySync } = require("../middlewares/sync.middleware");

router.use(authMiddleware.verifyToken);
router.use(validateSecuritySync);

router.get("/", taskController.getTasks);
router.patch("/:taskId", taskController.updateTaskStatus);
router.post("/seed", taskController.createSampleTasks);

module.exports = router;
