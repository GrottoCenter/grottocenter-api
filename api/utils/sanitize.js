const SENSITIVE_FIELDS = [
  'password',
  'token',
  'authorization',
  'secret',
  'apikey',
  'api_key',
];

const sanitize = (obj, maxDepth = 3, currentDepth = 0) => {
  if (!obj || typeof obj !== 'object' || currentDepth >= maxDepth) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .slice(0, 10)
      .map((item) => sanitize(item, maxDepth, currentDepth + 1));
  }

  return Object.keys(obj).reduce((acc, key) => {
    if (SENSITIVE_FIELDS.some((field) => key.toLowerCase().includes(field))) {
      acc[key] = '[REDACTED]';
    } else {
      acc[key] = sanitize(obj[key], maxDepth, currentDepth + 1);
    }
    return acc;
  }, {});
};

module.exports = sanitize;
