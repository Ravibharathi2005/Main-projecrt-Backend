const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const checkCollections = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = require("./src/models/User");
        const CompanyEmployee = require("./src/models/CompanyEmployee");
        
        const userCount = await User.countDocuments();
        const employeeCount = await CompanyEmployee.countDocuments();
        
        console.log(`User Count: ${userCount}`);
        console.log(`Employee Count: ${employeeCount}`);
        
        if (userCount > 0) {
            const sampleUser = await User.findOne({}, { employeeId: 1, name: 1 });
            console.log("Sample User:", sampleUser);
        }
        
        process.exit(0);
    } catch (err) {
        console.error("Check failed:", err);
        process.exit(1);
    }
};

checkCollections();
