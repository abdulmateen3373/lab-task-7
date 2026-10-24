// part1_in_memory/server.js - starts the server:  npm run part1
const app = require('./app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Student Management API (in-memory) running on http://localhost:${PORT}`));
