// part1_in_memory/app.js - STEP 7: put the four modules together
const express = require('express');
const { notFoundHandler, errorHandler } = require('../shared/http');

const app = express();
app.use(express.json());

app.use('/api/students', require('./routes/students'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/marks', require('./routes/marks'));

app.get('/', (req, res) => {
  res.json({
    name: 'Student Management System (in-memory API)',
    modules: ['/api/students', '/api/teachers', '/api/attendance', '/api/marks'],
    note: 'Data is stored in memory and resets when the server restarts.',
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
