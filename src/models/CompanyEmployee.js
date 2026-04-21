const mongoose = require("mongoose");

const companyEmployeeSchema = new mongoose.Schema({
  employeeId: String,
  name: String,
  position: String,
  company: String,
  department: String,
  email: String,
  phone: String,
  joiningDate: String,
  dob: String,
  gender: String,
  address: String,
  emergencyContact: String,
  manager: String,
  employmentType: String,
  workLocation: String,
  shift: String,
  salaryGrade: String,
  skills: [String],
  status: { type: String, default: "ACTIVE" }
});

module.exports = mongoose.model("CompanyEmployee", companyEmployeeSchema);