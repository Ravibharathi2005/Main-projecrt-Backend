const xlsx = require("xlsx");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const CompanyEmployee = require("../models/CompanyEmployee");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ DB Connected"))
  .catch(err => console.log(err));

const workbook = xlsx.readFile(path.join(__dirname, "../../employees.xlsx"));
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet);

const importData = async () => {
  try {
    console.log("📦 Excel Data:", data);

    await CompanyEmployee.deleteMany();
    await CompanyEmployee.insertMany(data);

    console.log("🔥 Data Imported Successfully");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

importData();