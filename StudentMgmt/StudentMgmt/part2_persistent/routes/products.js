// part2_persistent/routes/products.js - Products (CRUD)
const express = require('express');
const { products } = require('../db');
const { rules, validateFields } = require('../../shared/validators');
const { idParam } = require('../../shared/http');

const router = express.Router();
router.param('id', idParam);

const productRules = {
  name: rules.text(2, 80),
  price: rules.number(0.01, 10000000),
  stock: rules.integer(0, 1000000),
  category: rules.text(2, 40),
};

router.get('/', (req, res) => {
  const { category, search } = req.query;
  const list = products.all(
    (p) =>
      (!category || p.category.toLowerCase() === String(category).toLowerCase()) &&
      (!search || p.name.toLowerCase().includes(String(search).toLowerCase()))
  );
  res.json({ count: list.length, products: list });
});

router.get('/:id', (req, res) => {
  const product = products.find(req.id);
  if (!product) return res.status(404).json({ error: `Product ${req.id} not found` });
  res.json(product);
});

router.post('/', (req, res) => {
  const { errors, data } = validateFields(req.body, productRules);
  if (errors.length) return res.status(400).json({ errors });
  res.status(201).json(products.create(data));
});

function updateProduct(req, res, partial) {
  if (!products.find(req.id)) return res.status(404).json({ error: `Product ${req.id} not found` });
  const { errors, data } = validateFields(req.body, productRules, partial);
  if (errors.length) return res.status(400).json({ errors });
  res.json(products.update(req.id, data));
}
router.put('/:id', (req, res) => updateProduct(req, res, false));
router.patch('/:id', (req, res) => updateProduct(req, res, true));

router.delete('/:id', (req, res) => {
  const removed = products.remove(req.id);
  if (!removed) return res.status(404).json({ error: `Product ${req.id} not found` });
  res.json({ message: 'Product deleted', deleted: removed });
});

module.exports = router;
