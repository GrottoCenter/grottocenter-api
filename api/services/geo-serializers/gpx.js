/**
 * GPX Serializer
 *
 * Converts entrance documents into a GPX document with waypoints.
 * Produces GPX 1.1 output with the standard namespace and schema location.
 *
 * All text content is XML-escaped to prevent injection of invalid characters.
 *
 * Documents are pre-mapped by the controller: when field selection is active,
 * only aliased fields (plus id, latitude, longitude) are present. The serializer
 * excludes geometry/id fields from <desc> to honour the field-selection contract.
 */

const { escapeXml, toStringValue } = require('./xml-utils');

const contentType = 'application/gpx+xml';
const fileExtension = 'gpx';

/**
 * Fields used for geometry/waypoint construction that should not appear in <desc>.
 */
const GEOMETRY_FIELDS = ['latitude', 'longitude', 'altitude', 'name', 'id'];

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
 * Build a <desc> element containing document fields as plain text lines.
 *
 * @param {object} doc - Entrance document from Typesense
 * @returns {string} XML <desc> element, or empty string if no fields to show
 */
const buildDesc = (doc) => {
  const lines = Object.keys(doc)
    .filter((key) => !GEOMETRY_FIELDS.includes(key))
    .map((key) => `${key}: ${toStringValue(doc[key])}`);
  if (lines.length === 0) return '';
  return `<desc>${escapeXml(lines.join('\n'))}</desc>\n`;
};

/**
 * Serializes a single entrance document into a GPX waypoint element.
 *
 * @param {object} doc - Entrance document from Typesense
 * @returns {string} XML string of a <wpt> element
 */
const serializeWaypoint = (doc) => {
  const name = doc.name != null ? doc.name : '';
  const url = `https://grottocenter.org/ui/entrances/${doc.id}`;

  let wpt = `<wpt lat="${escapeXml(String(doc.latitude))}" lon="${escapeXml(String(doc.longitude))}">\n`;

  if (doc.altitude != null) {
    wpt += `<ele>${escapeXml(String(doc.altitude))}</ele>\n`;
  }

  wpt += `<name>${escapeXml(String(name))}</name>\n`;
  wpt += buildDesc(doc);
  wpt += `<link href="${escapeXml(url)}"><text>View on Grottocenter</text></link>\n`;
  wpt += '</wpt>\n';

  return wpt;
};

/**
 * Serializes a batch of entrance documents into GPX waypoint elements.
 *
 * @param {Array} documents - Array of filtered entrance documents
 * @param {boolean} _isFirst - Unused for GPX (XML elements concatenated)
 * @returns {string} Concatenated <wpt> XML elements
 */
const serializeBatch = (documents, _isFirst) => {
  if (documents.length === 0) {
    return '';
  }
  return documents.map((doc) => serializeWaypoint(doc)).join('');
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
