const parseBool = require('./parseBool');

const formatInvalidBoolError = (req, name, value) =>
  sails.helpers.formatStructuredError(
    req,
    `${name} must be a boolean ('true', 'false', '1' or '0').`,
    'E_BAD_REQUEST',
    { field: name, value }
  );

/**
 * Read a boolean request parameter with parseBool.
 *
 * Returns `{ value }` on success, with `defaultValue` substituted when the
 * parameter is absent, or `{ error }` holding a structured 400 body when the
 * value is not a recognised boolean encoding:
 *
 *   const isPermanent = readBoolParam(req, 'isPermanent', false);
 *   if (isPermanent.error) return res.badRequest(isPermanent.error);
 *
 * @param {object} req Sails request
 * @param {string} name parameter name, as read by `req.param(name)`
 * @param {boolean} [defaultValue] value returned when the parameter is absent
 * @returns {{ value: boolean | undefined } | { error: object }}
 */
const readBoolParam = (req, name, defaultValue) => {
  const raw = req.param(name);
  const value = parseBool(raw);
  if (value === parseBool.INVALID) {
    return { error: formatInvalidBoolError(req, name, raw) };
  }
  return { value: value ?? defaultValue };
};

/**
 * Validate several boolean parameters at once. Returns the structured 400 body
 * for the first invalid one, or `null` when every parameter is valid or absent.
 * Used where the values are read later by a service rather than by the
 * controller itself.
 *
 * @param {object} req Sails request
 * @param {string[]} names parameter names
 * @returns {object | null}
 */
readBoolParam.firstError = (req, names) => {
  for (const name of names) {
    const { error } = readBoolParam(req, name);
    if (error) return error;
  }
  return null;
};

readBoolParam.formatInvalidBoolError = formatInvalidBoolError;

module.exports = readBoolParam;
