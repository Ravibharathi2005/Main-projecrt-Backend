const mongoose = require("mongoose");

const companyEmployeeSchema = new mongoose.Schema({
  employeeId: String,
  name: String,
  position: String,
  company: String,
});

module.exports = mongoose.model("CompanyEmployee", companyEmployeeSchema);