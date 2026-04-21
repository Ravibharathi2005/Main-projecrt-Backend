const Task = require("../models/Task");
const CompanyEmployee = require("../models/CompanyEmployee");

exports.getTasks = async (req, res) => {
  try {
    const { employeeId } = req.user;
    const tasks = await Task.find({ employeeId }).sort({ deadline: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks" });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    
    const task = await Task.findByIdAndUpdate(
      taskId, 
      { status }, 
      { new: true }
    );
    
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Error updating task" });
  }
};

// Seed helper with department-based logic
exports.createSampleTasks = async (req, res) => {
  try {
    const { employeeId } = req.user;
    const employee = await CompanyEmployee.findOne({ employeeId: employeeId.toUpperCase() });
    
    if (!employee) return res.status(404).json({ message: "Employee not found in registry" });

    const dept = employee.department.toUpperCase();
    let samples = [];

    if (dept.includes("ANALYTICS") || dept.includes("OPERATIONS")) {
      samples = [
        { employeeId, title: "Q3 Performance Projections", priority: "HIGH", deadline: new Date("2026-05-15"), category: "Analytics" },
        { employeeId, title: "Operations Bottleneck Analysis", priority: "MEDIUM", deadline: new Date("2026-05-01"), category: "Operations" }
      ];
    } else if (dept.includes("SECURITY")) {
      samples = [
        { employeeId, title: "Q2 Network Perimeter Audit", priority: "URGENT", deadline: new Date("2026-04-30"), category: "Security" },
        { employeeId, title: "Vulnerability Disclosure Review", priority: "HIGH", deadline: new Date("2026-05-10"), category: "Security" }
      ];
    } else if (dept.includes("QA") || dept.includes("ENGINEERING")) {
      samples = [
        { employeeId, title: "API Endpoint Regression Suite", priority: "HIGH", deadline: new Date("2026-05-05"), category: "Engineering" },
        { employeeId, title: "System Stress Test (Phase 1)", priority: "MEDIUM", deadline: new Date("2026-05-12"), category: "QA" }
      ];
    } else if (dept.includes("HR")) {
      samples = [
          { employeeId, title: "Onboarding Cycle Optimization", priority: "MEDIUM", deadline: new Date("2026-05-20"), category: "Personnel" },
          { employeeId, title: "Quarterly Benefit Review", priority: "LOW", deadline: new Date("2026-06-01"), category: "Human Resources" }
      ];
    } else {
      samples = [
        { employeeId, title: "Standard Operational Review", priority: "LOW", deadline: new Date("2026-05-15"), category: "Operations" }
      ];
    }

    // Clear old seeded tasks for this user to avoid duplicates
    await Task.deleteMany({ employeeId });
    const inserted = await Task.insertMany(samples);
    
    res.json({ message: "Synchronized project milestones with department registry", data: inserted });
  } catch (error) {
    console.error("Task seed error:", error);
    res.status(500).json({ message: "Error seeding tasks" });
  }
};
