/**
 * GPX Serializer
 *
 * Converts entrance documents into a GPX document with waypoints.
 * Produces GPX 1.1 output with the standard namespace and schema location.
 *
 * All text content is XML-escaped to prevent injection of invalid characters.
 */

const contentType = 'application/gpx+xml';
const fileExtension = 'gpx';

/**
 * Escapes special XML characters in text content.
 *
 * @param {string} str - Raw string to escape
 * @returns {string} XML-safe string
 */
const escapeXml = (str) => {
  const s = String(str);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Produces the GPX XML declaration, root element with namespace and schema
 * location, and metadata block.
 *
 * @param {string} timestamp - ISO 8601 UTC timestamp of export generation
 * @returns {string} Opening XML fragment
 */
const prologue = (timestamp) =>
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<gpx xmlns="http://www.topografix.com/GPX/1/1"' +
  ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
  ' xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd"' +
  ' version="1.1"' +
  ' creator="Grottocenter">\n' +
  '<metadata>\n' +
  '<name>Grottocenter</name>\n' +
  '<desc>Exported from https://grottocenter.org</desc>\n' +
  `<time>${escapeXml(timestamp)}</time>\n` +
  '</metadata>\n';

/**
 * Convert a value to a plain string for display in <desc>.
 * Objects and arrays are JSON-serialized; primitives use String().
 *
 * @param {*} value - Any document field value
 * @returns {string} Human-readable string representation
 */
const toDisplayValue = (value) => {
  if (value == null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

/**
 * Build a <desc> element containing document fields as plain text lines.
 *
 * @param {object} doc - Entrance document from Typesense
 * @param {Array|null} fieldMapping - Optional array of {key, alias} for field selection/renaming
 * @returns {string} XML <desc> element, or empty string if no fields to show
 */
const buildDesc = (doc, fieldMapping) => {
  let lines;
  if (fieldMapping) {
    lines = fieldMapping
      .filter(({ key }) => key in doc)
      .map(({ key, alias }) => `${alias}: ${toDisplayValue(doc[key])}`);
  } else {
    lines = Object.keys(doc)
      .filter(
        (key) =>
          !['latitude', 'longitude', 'altitude', 'name', 'id'].includes(key)
      )
      .map((key) => `${key}: ${toDisplayValue(doc[key])}`);
  }
  if (lines.length === 0) return '';
  return `<desc>${escapeXml(lines.join('\n'))}</desc>\n`;
};

/**
 * Serializes a single entrance document into a GPX waypoint element.
 *
 * @param {object} doc - Entrance document from Typesense
 * @param {Array|null} fieldMapping - Optional array of {key, alias} for field selection/renaming
 * @returns {string} XML string of a <wpt> element
 */
const serializeWaypoint = (doc, fieldMapping) => {
  const name = doc.name != null ? doc.name : '';
  const url = `https://grottocenter.org/ui/entrances/${doc.id}`;

  let wpt = `<wpt lat="${escapeXml(String(doc.latitude))}" lon="${escapeXml(String(doc.longitude))}">\n`;

  if (doc.altitude != null) {
    wpt += `<ele>${escapeXml(String(doc.altitude))}</ele>\n`;
  }

  wpt += `<name>${escapeXml(String(name))}</name>\n`;
  wpt += buildDesc(doc, fieldMapping);
  wpt += `<link href="${escapeXml(url)}"><text>View on Grottocenter</text></link>\n`;
  wpt += '</wpt>\n';

  return wpt;
};

/**
 * Serializes a batch of entrance documents into GPX waypoint elements.
 *
 * @param {Array} documents - Array of filtered entrance documents
 * @param {boolean} _isFirst - Unused for GPX (XML elements concatenated)
 * @param {Array|null} fieldMapping - Optional array of {key, alias} for field selection/renaming in <desc>
 * @returns {string} Concatenated <wpt> XML elements
 */
const serializeBatch = (documents, _isFirst, fieldMapping = null) => {
  if (documents.length === 0) {
    return '';
  }
  return documents.map((doc) => serializeWaypoint(doc, fieldMapping)).join('');
};

/**
 * Produces the closing GPX root element.
 *
 * @returns {string} Closing XML fragment
 */
const epilogue = () => '</gpx>';

module.exports = {
  contentType,
  fileExtension,
  prologue,
  serializeBatch,
  epilogue,
};
