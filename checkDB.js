const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ DB Connected");
        
        const ActivityLog = require("./src/models/ActivityLog");
        const Alert = require("./src/models/Alert");
        const Session = require("./src/models/Session");
        
        const activityCount = await ActivityLog.countDocuments();
        const alertCount = await Alert.countDocuments();
        const sessionCount = await Session.countDocuments();
        
        console.log(`Activity Logs: ${activityCount}`);
        console.log(`Alerts: ${alertCount}`);
        console.log(`Sessions: ${sessionCount}`);
        
        process.exit(0);
    } catch (err) {
        console.error("❌ Test failed:", err);
        process.exit(1);
    }
};

connectDB();
