const cron = require("node-cron");
const User = require("../models/User");

const startRiskResetScheduler = () => {
  // Option A: Run exactly at 12:00 AM (midnight) every single day server time.
  cron.schedule("0 0 * * *", async () => {
    console.log("[SCHEDULER] Initiating daily Risk/Trust Score reset...");

    try {
      // Safely reset active scores to default, retaining all past logs and history.
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

      console.log(`[SCHEDULER] Successfully reset risk scores for ${result.modifiedCount} users.`);
    } catch (error) {
      console.error("[SCHEDULER] Critical error resetting daily risk scores:", error);
    }
  });

  console.log("⏱️ Daily Risk Score Scheduler Initialized.");
};

module.exports = startRiskResetScheduler;
