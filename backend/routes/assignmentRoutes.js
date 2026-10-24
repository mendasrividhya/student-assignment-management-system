
const express = require("express");
const Assignment = require("../models/Assignment");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All assignment routes require login
router.use(authMiddleware);

// Get assignments belonging to the logged-in student
router.get("/", async (req, res) => {
  try {
    const assignments = await Assignment.find({
      user: req.user.userId,
    }).sort({ createdAt: -1 });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch assignments." });
  }
});

// Get one assignment belonging to the logged-in student
router.get("/:id", async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }

    res.json(assignment);
  } catch (error) {
    res.status(400).json({ message: "Invalid assignment ID." });
  }
});

// Create an assignment for the logged-in student
router.post("/", async (req, res) => {
  try {
    const assignment = await Assignment.create({
      title: req.body.title,
      description: req.body.description,
      subject: req.body.subject,
      dueDate: req.body.dueDate,
      status: req.body.status || "Pending",
      user: req.user.userId,
    });

    res.status(201).json(assignment);
  } catch (error) {
    res.status(400).json({ message: "Failed to create assignment." });
  }
});

// Update only the logged-in student's assignment
router.put("/:id", async (req, res) => {
  try {
    const allowedFields = [
      "title",
      "description",
      "subject",
      "dueDate",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const assignment = await Assignment.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.userId,
      },
      updates,
      { new: true, runValidators: true }
    );

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }

    res.json(assignment);
  } catch (error) {
    res.status(400).json({ message: "Failed to update assignment." });
  }
});

// Delete only the logged-in student's assignment
router.delete("/:id", async (req, res) => {
  try {
    const assignment = await Assignment.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }

    res.json({ message: "Assignment deleted successfully." });
  } catch (error) {
    res.status(400).json({ message: "Failed to delete assignment." });
  }
});

module.exports = router;
