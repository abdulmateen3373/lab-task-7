// part1_in_memory/routes/students.js - STEP 3: Student module (CRUD)
const express = require('express');
const { students, attendance, marks } = require('../db');
const { rules, validateFields } = require('../../shared/validators');
const { idParam } = require('../../shared/http');

const router = express.Router();
router.param('id', idParam);

const studentRules = {
  name: rules.text(2, 60),
  rollNo: rules.text(3, 20),
  email: rules.email(),
  department: rules.text(2, 40),
  semester: rules.integer(1, 8),
};

const rollNoTaken = (rollNo, exceptId) =>
  students.findOne((s) => s.rollNo.toLowerCase() === rollNo.toLowerCase() && s.id !== exceptId) !== null;

// READ all  (optional filters: ?department=CS&search=ali)
router.get('/', (req, res) => {
  const { department, search } = req.query;
  const list = students.all(
    (s) =>
      (!department || s.department.toLowerCase() === String(department).toLowerCase()) &&
      (!search || `${s.name} ${s.rollNo}`.toLowerCase().includes(String(search).toLowerCase()))
  );
  res.json({ count: list.length, students: list });
});

// READ one
router.get('/:id', (req, res) => {
  const student = students.find(req.id);
  if (!student) return res.status(404).json({ error: `Student ${req.id} not found` });
  res.json(student);
});

// READ one student's attendance summary
router.get('/:id/attendance', (req, res) => {
  const student = students.find(req.id);
  if (!student) return res.status(404).json({ error: `Student ${req.id} not found` });
  const records = attendance.all((a) => a.studentId === req.id);
  const present = records.filter((a) => a.status === 'PRESENT').length;
  res.json({
    student: student.name,
    totalClasses: records.length,
    present,
    percentage: records.length ? Math.round((present / records.length) * 10000) / 100 : null,
    records,
  });
});

// READ one student's marks
router.get('/:id/marks', (req, res) => {
  const student = students.find(req.id);
  if (!student) return res.status(404).json({ error: `Student ${req.id} not found` });
  const records = marks.all((m) => m.studentId === req.id);
  const total = records.reduce((sum, m) => sum + m.totalMarks, 0);
  const obtained = records.reduce((sum, m) => sum + m.obtainedMarks, 0);
  res.json({
    student: student.name,
    overallPercentage: total ? Math.round((obtained / total) * 10000) / 100 : null,
    records,
  });
});

// CREATE
router.post('/', (req, res) => {
  const { errors, data } = validateFields(req.body, studentRules);
  if (errors.length) return res.status(400).json({ errors });
  if (rollNoTaken(data.rollNo)) return res.status(409).json({ error: `Roll number ${data.rollNo} already exists` });
  res.status(201).json(students.create(data));
});

// UPDATE - PUT replaces every field, PATCH changes only the fields you send
function updateStudent(req, res, partial) {
  if (!students.find(req.id)) return res.status(404).json({ error: `Student ${req.id} not found` });
  const { errors, data } = validateFields(req.body, studentRules, partial);
  if (errors.length) return res.status(400).json({ errors });
  if (data.rollNo && rollNoTaken(data.rollNo, req.id)) {
    return res.status(409).json({ error: `Roll number ${data.rollNo} already exists` });
  }
  res.json(students.update(req.id, data));
}
router.put('/:id', (req, res) => updateStudent(req, res, false));
router.patch('/:id', (req, res) => updateStudent(req, res, true));

// DELETE - also removes that student's attendance and marks (cascade)
router.delete('/:id', (req, res) => {
  const removed = students.remove(req.id);
  if (!removed) return res.status(404).json({ error: `Student ${req.id} not found` });
  const removedAttendance = attendance.removeWhere((a) => a.studentId === req.id);
  const removedMarks = marks.removeWhere((m) => m.studentId === req.id);
  res.json({ message: 'Student deleted', deleted: removed, removedAttendance, removedMarks });
});

module.exports = router;
