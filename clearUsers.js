const mongoose = require("mongoose");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");

dotenv.config();

const clearUsers = async () => {
  try {
    await connectDB();
    
    // We only clear the User collection (registered credentials)
    // We keep the CompanyEmployee collection (master data) so you can register again.
    const User = mongoose.model("User", new mongoose.Schema({})); 
    
    const count = await User.countDocuments();
    await User.deleteMany({});
    
    console.log(`\n✅ SUCCESS: Deleted ${count} registered user(s).`);
    console.log("Master employee data (CompanyEmployee) was preserved.\n");
    console.log("You can now start fresh with biometric registration for any valid Employee ID.\n");
    
    process.exit(0);
  } catch (err) {
    console.error("Cleanup error:", err);
    process.exit(1);
  }
};

clearUsers();
