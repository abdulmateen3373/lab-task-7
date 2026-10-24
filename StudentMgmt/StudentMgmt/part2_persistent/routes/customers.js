// part2_persistent/routes/customers.js - Customers (CRUD)
const express = require('express');
const { customers, orders } = require('../db');
const { rules, validateFields } = require('../../shared/validators');
const { idParam } = require('../../shared/http');

const router = express.Router();
router.param('id', idParam);

const customerRules = {
  name: rules.text(2, 60),
  email: rules.email(),
  address: rules.text(5, 200),
};

const emailTaken = (email, exceptId) => customers.findOne((c) => c.email === email && c.id !== exceptId) !== null;

router.get('/', (req, res) => {
  const list = customers.all();
  res.json({ count: list.length, customers: list });
});

router.get('/:id', (req, res) => {
  const customer = customers.find(req.id);
  if (!customer) return res.status(404).json({ error: `Customer ${req.id} not found` });
  res.json(customer);
});

router.get('/:id/orders', (req, res) => {
  if (!customers.find(req.id)) return res.status(404).json({ error: `Customer ${req.id} not found` });
  const list = orders.all((o) => o.customerId === req.id);
  res.json({ count: list.length, orders: list });
});

router.post('/', (req, res) => {
  const { errors, data } = validateFields(req.body, customerRules);
  if (errors.length) return res.status(400).json({ errors });
  if (emailTaken(data.email)) return res.status(409).json({ error: `Email ${data.email} already registered` });
  res.status(201).json(customers.create(data));
});

function updateCustomer(req, res, partial) {
  if (!customers.find(req.id)) return res.status(404).json({ error: `Customer ${req.id} not found` });
  const { errors, data } = validateFields(req.body, customerRules, partial);
  if (errors.length) return res.status(400).json({ errors });
  if (data.email && emailTaken(data.email, req.id)) return res.status(409).json({ error: `Email ${data.email} already registered` });
  res.json(customers.update(req.id, data));
}
router.put('/:id', (req, res) => updateCustomer(req, res, false));
router.patch('/:id', (req, res) => updateCustomer(req, res, true));

router.delete('/:id', (req, res) => {
  if (orders.findOne((o) => o.customerId === req.id && o.status !== 'CANCELLED')) {
    return res.status(409).json({ error: 'Customer has active orders and cannot be deleted' });
  }
  const removed = customers.remove(req.id);
  if (!removed) return res.status(404).json({ error: `Customer ${req.id} not found` });
  res.json({ message: 'Customer deleted', deleted: removed });
});

module.exports = router;
