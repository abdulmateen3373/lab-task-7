// part2_persistent/app.js - e-commerce endpoints backed by JSON files
const express = require('express');
const { notFoundHandler, errorHandler } = require('../shared/http');

const app = express();
app.use(express.json());

app.use('/api/products', require('./routes/products'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/orders', require('./routes/orders'));

app.get('/', (req, res) => {
  res.json({
    name: 'E-commerce Store API (persistent)',
    endpoints: ['/api/products', '/api/customers', '/api/orders'],
    note: 'Data is saved in JSON files and survives server restarts.',
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
