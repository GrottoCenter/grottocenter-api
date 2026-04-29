module.exports = function coerceBool(req, field) {
  const value = req.param(field);
  if (value === undefined || value === null) return value;
  return typeof value === 'string' ? value === 'true' : Boolean(value);
};
