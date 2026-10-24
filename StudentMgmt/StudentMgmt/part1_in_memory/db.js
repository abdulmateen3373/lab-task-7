// part1_in_memory/db.js - STEP 2: one in-memory store per module, with a little demo data
const MemoryStore = require('../store/memoryStore');

const students = new MemoryStore([
  { id: 1, name: 'Ali Raza', rollNo: 'F24-001', email: 'ali@uni.edu', department: 'CS', semester: 5 },
  { id: 2, name: 'Sara Khan', rollNo: 'F24-002', email: 'sara@uni.edu', department: 'SE', semester: 5 },
]);

const teachers = new MemoryStore([
  { id: 1, name: 'Dr. Bilal Ahmed', email: 'bilal@uni.edu', department: 'CS', subject: 'Full Stack Web Development' },
]);

const attendance = new MemoryStore([
  { id: 1, studentId: 1, course: 'FSWD', date: '2026-10-19', status: 'PRESENT' },
  { id: 2, studentId: 1, course: 'FSWD', date: '2026-10-20', status: 'ABSENT' },
]);

const marks = new MemoryStore([
  { id: 1, studentId: 1, course: 'FSWD', examType: 'QUIZ', totalMarks: 10, obtainedMarks: 8 },
]);

module.exports = { students, teachers, attendance, marks };
