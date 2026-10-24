// part1_in_memory/routes/marks.js - STEP 5: Marks module (CRUD)
const express = require('express');
const { students, marks } = require('../db');
const { rules, validateFields } = require('../../shared/validators');
const { idParam } = require('../../shared/http');

const router = express.Router();
router.param('id', idParam);

const marksRules = {
  studentId: rules.integer(1, Number.MAX_SAFE_INTEGER),
  course: rules.text(2, 20),
  examType: rules.oneOf(['QUIZ', 'ASSIGNMENT', 'MIDTERM', 'FINAL']),
  totalMarks: rules.number(1, 1000),
  obtainedMarks: rules.number(0, 1000),
};

const withPercentage = (m) => ({ ...m, percentage: Math.round((m.obtainedMarks / m.totalMarks) * 10000) / 100 });

// obtained marks may never be more than total marks (checked on the FINAL record)
function checkRecord(record) {
  if (!students.find(record.studentId)) return `Student ${record.studentId} does not exist`;
  if (record.obtainedMarks > record.totalMarks) return 'obtainedMarks cannot be greater than totalMarks';
  return null;
}

router.get('/', (req, res) => {
  const { studentId, course, examType } = req.query;
  const list = marks
    .all(
      (m) =>
        (!studentId || m.studentId === Number(studentId)) &&
        (!course || m.course.toLowerCase() === String(course).toLowerCase()) &&
        (!examType || m.examType === String(examType).toUpperCase())
    )
    .map(withPercentage);
  res.json({ count: list.length, marks: list });
});

router.get('/:id', (req, res) => {
  const record = marks.find(req.id);
  if (!record) return res.status(404).json({ error: `Marks record ${req.id} not found` });
  res.json(withPercentage(record));
});

router.post('/', (req, res) => {
  const { errors, data } = validateFields(req.body, marksRules);
  if (errors.length) return res.status(400).json({ errors });
  const problem = checkRecord(data);
  if (problem) return res.status(400).json({ error: problem });
  res.status(201).json(withPercentage(marks.create(data)));
});

function updateMarks(req, res, partial) {
  const existing = marks.find(req.id);
  if (!existing) return res.status(404).json({ error: `Marks record ${req.id} not found` });
  const { errors, data } = validateFields(req.body, marksRules, partial);
  if (errors.length) return res.status(400).json({ errors });
  const problem = checkRecord({ ...existing, ...data });
  if (problem) return res.status(400).json({ error: problem });
  res.json(withPercentage(marks.update(req.id, data)));
}
router.put('/:id', (req, res) => updateMarks(req, res, false));
router.patch('/:id', (req, res) => updateMarks(req, res, true));

router.delete('/:id', (req, res) => {
  const removed = marks.remove(req.id);
  if (!removed) return res.status(404).json({ error: `Marks record ${req.id} not found` });
  res.json({ message: 'Marks record deleted', deleted: removed });
});

module.exports = router;
