const Attendance = require("../models/Attendance");

exports.getAttendance = async (req, res) => {
  try {
    const { employeeId } = req.user;
    const history = await Attendance.find({ employeeId }).sort({ checkIn: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Error fetching attendance" });
  }
};

exports.checkIn = async (req, res) => {
  try {
    const { employeeId } = req.user;
    const date = new Date().toISOString().split('T')[0];

    const existing = await Attendance.findOne({ employeeId, date });
    if (existing) {
      return res.status(400).json({ message: "Already checked in for today" });
    }

    const attendance = new Attendance({
      employeeId,
      date,
      checkIn: new Date(),
      status: "PRESENT"
    });

    await attendance.save();
    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: "Check-in failed" });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const { employeeId } = req.user;
    const date = new Date().toISOString().split('T')[0];

    const attendance = await Attendance.findOne({ employeeId, date });
    if (!attendance) {
      return res.status(404).json({ message: "No check-in record found for today" });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: "Already checked out" });
    }

    attendance.checkOut = new Date();
    // Calculate work hours
    const diff = Math.abs(attendance.checkOut - attendance.checkIn);
    attendance.workHours = (diff / (1000 * 60 * 60)).toFixed(2);

    await attendance.save();
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: "Check-out failed" });
  }
};
