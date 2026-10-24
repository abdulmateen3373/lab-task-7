// shared/validators.js - small reusable validation helpers (no packages needed)

const rules = {
  text(min = 1, max = 100) {
    return {
      test: (v) => typeof v === 'string' && v.trim().length >= min && v.trim().length <= max,
      message: `must be text of ${min}-${max} characters`,
      clean: (v) => v.trim(),
    };
  },
  email() {
    return {
      test: (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      message: 'must be a valid email address',
      clean: (v) => v.trim().toLowerCase(),
    };
  },
  integer(min, max) {
    return {
      test: (v) => Number.isInteger(v) && v >= min && v <= max,
      message: `must be a whole number from ${min} to ${max}`,
    };
  },
  number(min, max = Infinity) {
    return {
      test: (v) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max,
      message: `must be a number from ${min}${max === Infinity ? ' upwards' : ` to ${max}`}`,
    };
  },
  date() {                                  // YYYY-MM-DD and a REAL calendar date
    return {
      test: (v) =>
        typeof v === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(v) &&
        new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v,
      message: 'must be a real date in YYYY-MM-DD format',
    };
  },
  oneOf(list) {
    return {
      test: (v) => list.includes(v),
      message: `must be one of: ${list.join(', ')}`,
    };
  },
};

// Checks req.body against a rule set. Returns { errors, data }.
//  - data contains ONLY the known fields (extra fields are ignored)
//  - partial = true lets PATCH send just some fields
function validateFields(body, ruleSet, partial = false) {
  const errors = [];
  const data = {};

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { errors: ['Request body must be a JSON object'], data };
  }
  for (const [field, rule] of Object.entries(ruleSet)) {
    const value = body[field];
    if (value === undefined) {
      if (!partial) errors.push(`${field} is required`);
      continue;
    }
    if (!rule.test(value)) {
      errors.push(`${field} ${rule.message}`);
      continue;
    }
    data[field] = rule.clean ? rule.clean(value) : value;
  }
  if (partial && errors.length === 0 && Object.keys(data).length === 0) {
    errors.push('Send at least one field to update');
  }
  return { errors, data };
}

module.exports = { rules, validateFields };
