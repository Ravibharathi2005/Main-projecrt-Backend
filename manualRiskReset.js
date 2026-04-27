const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./src/models/User");

// Load Environment Variables
dotenv.config();

const manualRiskReset = async () => {
  console.log("=========================================");
  console.log("⚕️ DEVELOPER UTILITY: MANUAL RISK RESET");
  console.log("=========================================\n");

  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from .env file!");
    }

    console.log("🔄 Connecting to Database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Database Connected Successfully.\n");

    console.log("⚙️ Executing AI Risk Architecture Override...");
    
    // Safely reset active scores to default
    const result = await User.updateMany(
      {},
      {
        $set: {
          trustScore: 100,
          riskLevel: "LOW",
          lastRiskReset: new Date(),
        },
      }
    );

    console.log(`✅ SUCCESS: Force-Reset Risk Scores for [${result.modifiedCount}] users.`);
    console.log(`   └─ Trust Score -> 100`);
    console.log(`   └─ Risk Level  -> LOW\n`);

  } catch (error) {
    console.error("❌ CRITICAL ERROR:", error.message);
  } finally {
    // Terminate DB thread
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log("🛑 Database Connection Safely Terminated.");
    }
    process.exit(0);
  }
};

manualRiskReset();
