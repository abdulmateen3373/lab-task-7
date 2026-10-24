Lab Task #07 - Student Management System (Part 1) + Persistent API (Part 2)

SETUP (once)
  1. Install Node.js 18+ (check with: node --version)
  2. In this folder run:  npm install

PART 1 - in-memory Student Management API     npm run part1     -> http://localhost:3000
  /api/students    /api/teachers    /api/attendance    /api/marks     (each has full CRUD)
PART 2 - persistent e-commerce API            npm run part2     -> http://localhost:4000
  /api/products    /api/customers   /api/orders     (saved in part2_persistent/data/*.json)

RUN THE TESTS            npm test

METHODS (same pattern for every module)
  GET    /api/<module>            list (with ?filters)
  GET    /api/<module>/:id        one record
  POST   /api/<module>            create
  PUT    /api/<module>/:id        replace (all fields required)
  PATCH  /api/<module>/:id        change only the fields you send
  DELETE /api/<module>/:id        delete

Try requests with Postman / Thunder Client (VS Code), or PowerShell:
  Invoke-RestMethod http://localhost:3000/api/students
  Invoke-RestMethod -Method Post http://localhost:3000/api/students -ContentType 'application/json' `
    -Body '{"name":"Hina Noor","rollNo":"F24-050","email":"hina@uni.edu","department":"AI","semester":3}'

FOLDERS
  shared/            validators.js, http.js
  store/             memoryStore.js (Part 1), fileStore.js (Part 2)
  part1_in_memory/   db.js, routes/ (4 modules), app.js, server.js
  part2_persistent/  db.js, routes/ (3 modules), app.js, server.js
  test/              part1.test.js, part2.test.js
