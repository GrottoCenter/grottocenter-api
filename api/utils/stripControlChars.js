// C0 controls except tab (0x09), LF (0x0A) and CR (0x0D), plus DEL. XML 1.0
// forbids them, and 0x1D / 0x1E / 0x1F are the MARC (ISO 2709) record, field
// and subfield delimiters, which the serializer does not escape.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Removes the control characters that break XML and MARC output.
 * Strings are cleaned; arrays and plain objects are cleaned recursively;
 * anything else (numbers, dates, null, …) is returned unchanged.
 * @param {*} value
 * @returns {*} The cleaned value (a copy for arrays and objects).
 */
const stripControlChars = (value) => {
  if (typeof value === 'string') return value.replace(CONTROL_CHARS, '');
  if (Array.isArray(value)) return value.map(stripControlChars);
  if (
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, stripControlChars(v)])
    );
  }
  return value;
};

module.exports = stripControlChars;
