const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./src/config/db");

// 🔹 Load env
dotenv.config();

// 🔹 Connect DB
connectDB();

// 🔹 Init app
const app = express();

// 🔹 Middlewares
app.use(cors());
app.use(express.json());

// 🔹 Test route
app.get("/", (req, res) => {
  res.send("Backend Working 🔥");
});

// 🔹 Routes
app.use("/api/auth", require("./src/routes/auth.routes"));
app.use("/api/activity", require("./src/routes/activity.routes"));
app.use("/api/alerts", require("./src/routes/alert.routes"));
app.use("/api/dashboard", require("./src/routes/dashboard.routes"));
app.use("/api/risk", require("./src/routes/risk.routes"));

// 🔹 Start server
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});