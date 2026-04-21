const CompanyEmployee = require("../models/CompanyEmployee");
const Task = require("../models/Task");
const Attendance = require("../models/Attendance");

const getEmployeeProfile = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await CompanyEmployee.findOne({ employeeId: employeeId.toUpperCase() });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found in corporate dataset",
      });
    }

    res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error("Fetch profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error fetching dossier",
    });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const { employeeId } = req.user;

    // Fetch real metrics
    const tasks = await Task.find({ employeeId });
    const attendance = await Attendance.find({ employeeId });
    const totalEmployees = await CompanyEmployee.countDocuments();

    const pendingTasks = tasks.filter(t => t.status !== 'DONE').length;
    const completedTasks = tasks.filter(t => t.status === 'DONE').length;
    const taskAccuracy = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 100;

    const attendanceStreak = attendance.length; // Simplified streak for demo
    const lastSession = attendance.length > 0 ? attendance[attendance.length - 1] : null;
    const isClockedIn = lastSession && !lastSession.checkOut;

    res.json({
      success: true,
      stats: {
        pendingTasks,
        completedTasks,
        taskAccuracy,
        attendanceStreak,
        isClockedIn,
        totalEmployees,
        employeeRole: req.user.role
      }
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ success: false, message: "Error calculating portal telemetry" });
  }
};

module.exports = {
  getEmployeeProfile,
  getDashboardStats
};
