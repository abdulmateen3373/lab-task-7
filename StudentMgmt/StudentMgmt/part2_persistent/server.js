// part2_persistent/server.js - starts the server:  npm run part2
const app = require('./app');

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`E-commerce API (persistent) running on http://localhost:${PORT}`));
