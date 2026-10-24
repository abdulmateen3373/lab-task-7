// Tests for Part 1 - run with:  npm test
const test = require('node:test');
const assert = require('node:assert');
const app = require('../part1_in_memory/app');

let server, base;
test.before(() => new Promise((resolve) => {
  server = app.listen(0, () => { base = `http://localhost:${server.address().port}`; resolve(); });
}));
test.after(() => server.close());

const call = async (method, path, body) => {
  const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, body: await res.json() };
};

test('students: full CRUD + validation + duplicates', async () => {
  const bad = await call('POST', '/api/students', { name: 'X', email: 'nope', semester: 20 });
  assert.strictEqual(bad.status, 400);
  assert.ok(bad.body.errors.length >= 4);

  const created = await call('POST', '/api/students', { name: 'Hina Noor', rollNo: 'F24-050', email: 'hina@uni.edu', department: 'AI', semester: 3 });
  assert.strictEqual(created.status, 201);
  const id = created.body.id;

  assert.strictEqual((await call('POST', '/api/students', { name: 'Copy Cat', rollNo: 'f24-050', email: 'c@uni.edu', department: 'AI', semester: 3 })).status, 409);
  assert.strictEqual((await call('GET', `/api/students/${id}`)).body.name, 'Hina Noor');
  assert.strictEqual((await call('PATCH', `/api/students/${id}`, { semester: 4 })).body.semester, 4);
  assert.strictEqual((await call('PUT', `/api/students/${id}`, { name: 'Hina N' })).status, 400);       // PUT needs all fields
  assert.strictEqual((await call('GET', '/api/students/abc')).status, 400);
  assert.strictEqual((await call('GET', '/api/students/9999')).status, 404);
  assert.strictEqual((await call('GET', '/api/students?department=ai')).body.count, 1);
  assert.strictEqual((await call('DELETE', `/api/students/${id}`)).status, 200);
  assert.strictEqual((await call('GET', `/api/students/${id}`)).status, 404);
});

test('teachers: CRUD', async () => {
  const created = await call('POST', '/api/teachers', { name: 'Dr. Sana', email: 'sana@uni.edu', department: 'CS', subject: 'DAA' });
  assert.strictEqual(created.status, 201);
  assert.strictEqual((await call('POST', '/api/teachers', { name: 'Dr. Dup', email: 'SANA@uni.edu', department: 'CS', subject: 'OS' })).status, 409);
  assert.strictEqual((await call('PUT', `/api/teachers/${created.body.id}`, { name: 'Dr. Sana K', email: 'sana@uni.edu', department: 'CS', subject: 'DAA' })).status, 200);
  assert.strictEqual((await call('DELETE', `/api/teachers/${created.body.id}`)).status, 200);
});

test('attendance: rules, duplicates, student must exist, summary', async () => {
  assert.strictEqual((await call('POST', '/api/attendance', { studentId: 999, course: 'FSWD', date: '2026-10-21', status: 'PRESENT' })).status, 400);
  assert.strictEqual((await call('POST', '/api/attendance', { studentId: 1, course: 'FSWD', date: '2026-02-30', status: 'PRESENT' })).status, 400);   // not a real date
  assert.strictEqual((await call('POST', '/api/attendance', { studentId: 1, course: 'FSWD', date: '2026-10-19', status: 'PRESENT' })).status, 409);   // already exists
  const ok = await call('POST', '/api/attendance', { studentId: 1, course: 'FSWD', date: '2026-10-21', status: 'LEAVE' });
  assert.strictEqual(ok.status, 201);
  assert.strictEqual((await call('PATCH', `/api/attendance/${ok.body.id}`, { status: 'PRESENT' })).body.status, 'PRESENT');
  const summary = await call('GET', '/api/students/1/attendance');
  assert.strictEqual(summary.body.totalClasses, 3);
  assert.strictEqual(summary.body.present, 2);
  assert.strictEqual((await call('DELETE', `/api/attendance/${ok.body.id}`)).status, 200);
});

test('marks: obtained cannot exceed total, percentage, cascade delete', async () => {
  assert.strictEqual((await call('POST', '/api/marks', { studentId: 1, course: 'FSWD', examType: 'MIDTERM', totalMarks: 50, obtainedMarks: 51 })).status, 400);
  const ok = await call('POST', '/api/marks', { studentId: 2, course: 'FSWD', examType: 'MIDTERM', totalMarks: 50, obtainedMarks: 40 });
  assert.strictEqual(ok.status, 201);
  assert.strictEqual(ok.body.percentage, 80);
  assert.strictEqual((await call('PATCH', `/api/marks/${ok.body.id}`, { totalMarks: 30 })).status, 400);         // would make obtained > total
  assert.strictEqual((await call('GET', '/api/students/2/marks')).body.overallPercentage, 80);
  const del = await call('DELETE', '/api/students/2');                                                             // cascade
  assert.strictEqual(del.body.removedMarks, 1);
  assert.strictEqual((await call('GET', '/api/marks?studentId=2')).body.count, 0);
});

test('errors: unknown route and malformed JSON', async () => {
  assert.strictEqual((await call('GET', '/api/nothing')).status, 404);
  const res = await fetch(base + '/api/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{ bad json' });
  assert.strictEqual(res.status, 400);
});
