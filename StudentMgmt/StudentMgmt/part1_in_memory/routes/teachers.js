// part1_in_memory/routes/teachers.js - STEP 4: Teacher module (CRUD)
const express = require('express');
const { teachers } = require('../db');
const { rules, validateFields } = require('../../shared/validators');
const { idParam } = require('../../shared/http');

const router = express.Router();
router.param('id', idParam);

const teacherRules = {
  name: rules.text(2, 60),
  email: rules.email(),
  department: rules.text(2, 40),
  subject: rules.text(2, 80),
};

const emailTaken = (email, exceptId) => teachers.findOne((t) => t.email === email && t.id !== exceptId) !== null;

router.get('/', (req, res) => {
  const { department } = req.query;
  const list = teachers.all((t) => !department || t.department.toLowerCase() === String(department).toLowerCase());
  res.json({ count: list.length, teachers: list });
});

router.get('/:id', (req, res) => {
  const teacher = teachers.find(req.id);
  if (!teacher) return res.status(404).json({ error: `Teacher ${req.id} not found` });
  res.json(teacher);
});

router.post('/', (req, res) => {
  const { errors, data } = validateFields(req.body, teacherRules);
  if (errors.length) return res.status(400).json({ errors });
  if (emailTaken(data.email)) return res.status(409).json({ error: `Email ${data.email} already exists` });
  res.status(201).json(teachers.create(data));
});

function updateTeacher(req, res, partial) {
  if (!teachers.find(req.id)) return res.status(404).json({ error: `Teacher ${req.id} not found` });
  const { errors, data } = validateFields(req.body, teacherRules, partial);
  if (errors.length) return res.status(400).json({ errors });
  if (data.email && emailTaken(data.email, req.id)) {
    return res.status(409).json({ error: `Email ${data.email} already exists` });
  }
  res.json(teachers.update(req.id, data));
}
router.put('/:id', (req, res) => updateTeacher(req, res, false));
router.patch('/:id', (req, res) => updateTeacher(req, res, true));

router.delete('/:id', (req, res) => {
  const removed = teachers.remove(req.id);
  if (!removed) return res.status(404).json({ error: `Teacher ${req.id} not found` });
  res.json({ message: 'Teacher deleted', deleted: removed });
});

module.exports = router;
