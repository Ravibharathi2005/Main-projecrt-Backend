const express = require("express");
const cors = require("cors");

const app = express();
const authRoutes = require("./routes/auth.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const riskRoutes = require("./routes/risk.routes");
const activityRoutes = require("./routes/activity.routes");
const alertRoutes = require("./routes/alert.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const taskRoutes = require("./routes/task.routes");
const salaryRoutes = require("./routes/salary.routes");

app.use(cors());
app.use(express.json());

// Main Security & Business Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/risk", riskRoutes);
app.use("/api/activity", activityRoutes); // Standard telemetry endpoint
app.use("/api/alerts", alertRoutes);

// New Enterprise Business Modules
app.use("/api/attendance", attendanceRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/salary", salaryRoutes);

// Legacy/Fallback Routes
app.use("/activity", activityRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/risk", riskRoutes);
app.use("/alerts", alertRoutes);

// 🔥 test route
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

module.exports = app;