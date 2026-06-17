/**
 * Shared XML utilities for geo-serializers (KML, GPX).
 *
 * Provides consistent null-handling and XML character escaping across
 * all XML-based export formats.
 */

/**
 * Convert a value to a plain string suitable for XML text content.
 * - null/undefined → empty string
 * - objects/arrays → JSON-serialized
 * - primitives → String()
 *
 * @param {*} value - Any value from a document field
 * @returns {string} String representation (never "null" or "undefined")
 */
const toStringValue = (value) => {
  if (value == null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

/**
 * Escape special XML characters in text content.
 *
 * @param {*} value - Value to escape (coerced to string via toStringValue)
 * @returns {string} XML-safe string
 */
const escapeXml = (value) =>
  toStringValue(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

module.exports = {
  toStringValue,
  escapeXml,
};
