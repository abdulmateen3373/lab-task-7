// part2_persistent/routes/orders.js - Orders (create, read, change status, delete cancelled)
const express = require('express');
const { products, customers, orders } = require('../db');
const { rules, validateFields } = require('../../shared/validators');
const { idParam } = require('../../shared/http');

const router = express.Router();
router.param('id', idParam);

const STATUSES = ['PLACED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const itemRules = {
  productId: rules.integer(1, Number.MAX_SAFE_INTEGER),
  quantity: rules.integer(1, 1000),
};

router.get('/', (req, res) => {
  const { status, customerId } = req.query;
  const list = orders.all(
    (o) => (!status || o.status === String(status).toUpperCase()) && (!customerId || o.customerId === Number(customerId))
  );
  res.json({ count: list.length, orders: list });
});

router.get('/:id', (req, res) => {
  const order = orders.find(req.id);
  if (!order) return res.status(404).json({ error: `Order ${req.id} not found` });
  res.json(order);
});

// Place an order: validates everything FIRST, then reduces stock and saves
router.post('/', (req, res) => {
  const body = req.body ?? {};
  const customerId = body.customerId;
  if (!Number.isInteger(customerId) || !customers.find(customerId)) {
    return res.status(400).json({ error: 'customerId must belong to an existing customer' });
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return res.status(400).json({ error: 'items must be a non-empty array of { productId, quantity }' });
  }

  const lines = [];
  const errors = [];
  body.items.forEach((item, index) => {
    const check = validateFields(item, itemRules);
    if (check.errors.length) {
      errors.push(...check.errors.map((e) => `items[${index}].${e}`));
      return;
    }
    const product = products.find(check.data.productId);
    if (!product) { errors.push(`items[${index}]: product ${check.data.productId} not found`); return; }
    if (product.stock < check.data.quantity) {
      errors.push(`items[${index}]: only ${product.stock} of "${product.name}" in stock`);
      return;
    }
    lines.push({ productId: product.id, name: product.name, unitPrice: product.price, quantity: check.data.quantity });
  });
  if (errors.length) return res.status(400).json({ errors });

  // same product listed twice? make sure TOTAL quantity still fits in stock
  for (const line of lines) {
    const totalWanted = lines.filter((l) => l.productId === line.productId).reduce((s, l) => s + l.quantity, 0);
    if (totalWanted > products.find(line.productId).stock) {
      return res.status(400).json({ error: `Not enough stock for "${line.name}"` });
    }
  }

  lines.forEach((line) => {
    const product = products.find(line.productId);
    products.update(product.id, { stock: product.stock - line.quantity });
  });
  const total = Math.round(lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0) * 100) / 100;
  const order = orders.create({ customerId, items: lines, total, status: 'PLACED', createdAt: new Date().toISOString() });
  res.status(201).json(order);
});

// Change status. Cancelling puts the items back into stock.
const allowedNext = { PLACED: ['SHIPPED', 'CANCELLED'], SHIPPED: ['DELIVERED'], DELIVERED: [], CANCELLED: [] };

router.patch('/:id/status', (req, res) => {
  const order = orders.find(req.id);
  if (!order) return res.status(404).json({ error: `Order ${req.id} not found` });

  const { errors, data } = validateFields(req.body, { status: rules.oneOf(STATUSES) });
  if (errors.length) return res.status(400).json({ errors });
  if (!allowedNext[order.status].includes(data.status)) {
    return res.status(409).json({ error: `Cannot change an order from ${order.status} to ${data.status}` });
  }
  if (data.status === 'CANCELLED') {
    order.items.forEach((line) => {
      const product = products.find(line.productId);
      if (product) products.update(product.id, { stock: product.stock + line.quantity });
    });
  }
  res.json(orders.update(req.id, { status: data.status }));
});

// Only cancelled orders can be deleted
router.delete('/:id', (req, res) => {
  const order = orders.find(req.id);
  if (!order) return res.status(404).json({ error: `Order ${req.id} not found` });
  if (order.status !== 'CANCELLED') return res.status(409).json({ error: 'Only CANCELLED orders can be deleted' });
  res.json({ message: 'Order deleted', deleted: orders.remove(req.id) });
});

module.exports = router;
