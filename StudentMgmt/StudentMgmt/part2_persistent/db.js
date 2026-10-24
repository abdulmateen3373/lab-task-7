// part2_persistent/db.js - STEP 6: the SAME store API, but saved to JSON files
// Files are created in part2_persistent/data/ (or in the folder named by the DATA_DIR environment variable).
const path = require('path');
const FileStore = require('../store/fileStore');

const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');

const products = new FileStore(path.join(dataDir, 'products.json'), [
  { id: 1, name: 'Wireless Mouse', price: 1800, stock: 25, category: 'Accessories' },
  { id: 2, name: 'Mechanical Keyboard', price: 7500, stock: 10, category: 'Accessories' },
  { id: 3, name: 'USB-C Cable', price: 600, stock: 100, category: 'Cables' },
]);
const customers = new FileStore(path.join(dataDir, 'customers.json'));
const orders = new FileStore(path.join(dataDir, 'orders.json'));

module.exports = { products, customers, orders };
