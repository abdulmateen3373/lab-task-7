// Tests for Part 2 - proves the data is PERSISTENT (survives a "restart")
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ecommerce-'));
const app = require('../part2_persistent/app');
const FileStore = require('../store/fileStore');

let server, base;
test.before(() => new Promise((resolve) => {
  server = app.listen(0, () => { base = `http://localhost:${server.address().port}`; resolve(); });
}));
test.after(() => server.close());

const call = async (method, p, body) => {
  const res = await fetch(base + p, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, body: await res.json() };
};

test('products CRUD + validation', async () => {
  assert.strictEqual((await call('POST', '/api/products', { name: 'A', price: -5 })).status, 400);
  const created = await call('POST', '/api/products', { name: 'Laptop Stand', price: 3200, stock: 5, category: 'Accessories' });
  assert.strictEqual(created.status, 201);
  assert.strictEqual((await call('PATCH', `/api/products/${created.body.id}`, { price: 2999 })).body.price, 2999);
  assert.strictEqual((await call('GET', '/api/products?category=cables')).body.count, 1);
});

test('orders: stock reduces, cancel restores, rules enforced', async () => {
  const customer = await call('POST', '/api/customers', { name: 'Ali Raza', email: 'ali@shop.com', address: 'House 5, F-10, Islamabad' });
  assert.strictEqual(customer.status, 201);

  assert.strictEqual((await call('POST', '/api/orders', { customerId: 999, items: [{ productId: 1, quantity: 1 }] })).status, 400);
  assert.strictEqual((await call('POST', '/api/orders', { customerId: customer.body.id, items: [{ productId: 2, quantity: 11 }] })).status, 400);   // only 10 in stock

  const order = await call('POST', '/api/orders', { customerId: customer.body.id, items: [{ productId: 1, quantity: 2 }, { productId: 3, quantity: 10 }] });
  assert.strictEqual(order.status, 201);
  assert.strictEqual(order.body.total, 1800 * 2 + 600 * 10);
  assert.strictEqual((await call('GET', '/api/products/1')).body.stock, 23);

  assert.strictEqual((await call('PATCH', `/api/orders/${order.body.id}/status`, { status: 'DELIVERED' })).status, 409);   // must ship first
  assert.strictEqual((await call('DELETE', `/api/orders/${order.body.id}`)).status, 409);                                   // not cancelled
  assert.strictEqual((await call('DELETE', `/api/customers/${customer.body.id}`)).status, 409);                             // has active order

  assert.strictEqual((await call('PATCH', `/api/orders/${order.body.id}/status`, { status: 'CANCELLED' })).body.status, 'CANCELLED');
  assert.strictEqual((await call('GET', '/api/products/1')).body.stock, 25);                                                 // stock restored
  assert.strictEqual((await call('DELETE', `/api/orders/${order.body.id}`)).status, 200);
});

test('PERSISTENCE: data is still there after a restart', async () => {
  const before = (await call('GET', '/api/products')).body.products;
  // "restart": build brand-new stores that load the saved JSON files from disk
  const reloaded = new FileStore(path.join(process.env.DATA_DIR, 'products.json'));
  assert.deepStrictEqual(reloaded.all(), before);
  assert.ok(fs.existsSync(path.join(process.env.DATA_DIR, 'orders.json')));
  // new ids continue from where they stopped (no id reuse)
  assert.strictEqual(reloaded.create({ name: 'x', price: 1, stock: 1, category: 'xx' }).id, Math.max(...before.map((p) => p.id)) + 1);
});
