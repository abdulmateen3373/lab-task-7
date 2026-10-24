// part1_in_memory/routes/attendance.js - STEP 5: Attendance module (CRUD)
const express = require('express');
const { students, attendance } = require('../db');
const { rules, validateFields } = require('../../shared/validators');
const { idParam } = require('../../shared/http');

const router = express.Router();
router.param('id', idParam);

const attendanceRules = {
  studentId: rules.integer(1, Number.MAX_SAFE_INTEGER),
  course: rules.text(2, 20),
  date: rules.date(),
  status: rules.oneOf(['PRESENT', 'ABSENT', 'LEAVE']),
};

// one record per student + course + date
const duplicate = (rec, exceptId) =>
  attendance.findOne(
    (a) => a.studentId === rec.studentId && a.course === rec.course && a.date === rec.date && a.id !== exceptId
  ) !== null;

// READ all  (filters: ?studentId=1&course=FSWD&date=2026-10-19&status=PRESENT)
router.get('/', (req, res) => {
  const { studentId, course, date, status } = req.query;
  const list = attendance.all(
    (a) =>
      (!studentId || a.studentId === Number(studentId)) &&
      (!course || a.course.toLowerCase() === String(course).toLowerCase()) &&
      (!date || a.date === date) &&
      (!status || a.status === String(status).toUpperCase())
  );
  res.json({ count: list.length, attendance: list });
});

router.get('/:id', (req, res) => {
  const record = attendance.find(req.id);
  if (!record) return res.status(404).json({ error: `Attendance record ${req.id} not found` });
  res.json(record);
});

router.post('/', (req, res) => {
  const { errors, data } = validateFields(req.body, attendanceRules);
  if (errors.length) return res.status(400).json({ errors });
  if (!students.find(data.studentId)) return res.status(400).json({ error: `Student ${data.studentId} does not exist` });
  if (duplicate(data)) return res.status(409).json({ error: 'Attendance for this student, course and date already exists' });
  res.status(201).json(attendance.create(data));
});

function updateAttendance(req, res, partial) {
  const existing = attendance.find(req.id);
  if (!existing) return res.status(404).json({ error: `Attendance record ${req.id} not found` });
  const { errors, data } = validateFields(req.body, attendanceRules, partial);
  if (errors.length) return res.status(400).json({ errors });

  const merged = { ...existing, ...data };                      // check the FINAL record, not just the changes
  if (!students.find(merged.studentId)) return res.status(400).json({ error: `Student ${merged.studentId} does not exist` });
  if (duplicate(merged, req.id)) return res.status(409).json({ error: 'Attendance for this student, course and date already exists' });
  res.json(attendance.update(req.id, data));
}
router.put('/:id', (req, res) => updateAttendance(req, res, false));
router.patch('/:id', (req, res) => updateAttendance(req, res, true));

router.delete('/:id', (req, res) => {
  const removed = attendance.remove(req.id);
  if (!removed) return res.status(404).json({ error: `Attendance record ${req.id} not found` });
  res.json({ message: 'Attendance record deleted', deleted: removed });
});

module.exports = router;
