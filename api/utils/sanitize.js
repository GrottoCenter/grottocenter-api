const SENSITIVE_FIELDS = [
  'password',
  'token',
  'authorization',
  'secret',
  'apikey',
  'api_key',
  // The hyphenated spelling is how the header is actually written (`x-api-key`),
  // and neither of the two above matches it.
  'api-key',
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
// Exposed so the log-redaction util can share one definition of "sensitive"
// without duplicating the list. See api/utils/redactLogArgs.js.
module.exports.SENSITIVE_FIELDS = SENSITIVE_FIELDS;
