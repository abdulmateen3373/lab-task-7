// shared/http.js - helpers used by both parts

// router.param('id', idParam) validates /:id once for every route that has it
function idParam(req, res, next, value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'id must be a positive whole number' });
  }
  req.id = id;
  next();
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// must have 4 parameters so Express treats it as the error handler
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON in request body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = { idParam, notFoundHandler, errorHandler };
