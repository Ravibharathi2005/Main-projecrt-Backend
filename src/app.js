const express = require("express");
const cors = require("cors");

const app = express();
const authRoutes = require("./routes/auth.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const riskRoutes = require("./routes/risk.routes");
const activityRoutes = require("./routes/activity.routes");
const alertRoutes = require("./routes/alert.routes");

app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/risk", riskRoutes);
app.use("/api/activity-log", activityRoutes);
// backward compatibility
app.use("/activity", activityRoutes);
app.use("/alerts", alertRoutes);

// 🔥 test route
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

module.exports = app;