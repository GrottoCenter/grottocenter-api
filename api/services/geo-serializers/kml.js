/**
 * KML Serializer
 *
 * Converts entrance documents into a KML document with Point Placemarks.
 * Produces valid KML 2.2 with namespace http://www.opengis.net/kml/2.2.
 *
 * Each entrance becomes a <Placemark> with:
 * - <name> from the document's name field
 * - <Point><coordinates>lon,lat,alt</coordinates></Point>
 * - <ExtendedData> with <Data> elements for all document fields plus url
 */

const contentType = 'application/vnd.google-earth.kml+xml';
const fileExtension = 'kml';

/**
 * Convert a value to a plain string suitable for XML text content.
 * Objects and arrays are JSON-serialized; primitives are coerced with String().
 *
 * @param {*} value - Any value from a document field
 * @returns {string} String representation
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

/**
 * Produce the KML document opening: XML declaration, <kml> root with
 * namespace, <Document> with metadata (name, description, timestamp).
 *
 * @param {string} timestamp - ISO 8601 UTC timestamp of the export
 * @returns {string} KML prologue string
 */
const prologue = (timestamp) =>
  `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
<name>Grottocenter</name>
<description>Exported from https://grottocenter.org</description>
<TimeStamp><when>${escapeXml(timestamp)}</when></TimeStamp>`;

/**
 * Serialize a batch of entrance documents into KML Placemark elements.
 *
 * @param {Array} documents - Filtered entrance documents (no sensitive, no null coords)
 * @param {boolean} _isFirst - Unused for KML (XML elements concatenate without separators)
 * @param {Array|null} fieldMapping - Optional array of {key, alias} for field selection/renaming
 * @returns {string} KML Placemark elements
 */
const serializeBatch = (documents, _isFirst, fieldMapping = null) =>
  documents
    .map((doc) => {
      const name = doc.name != null ? doc.name : '';
      const lon = doc.longitude;
      const lat = doc.latitude;
      const alt = doc.altitude != null ? doc.altitude : 0;
      const url = `https://grottocenter.org/ui/entrances/${doc.id}`;

      let dataEntries;
      if (fieldMapping) {
        dataEntries = fieldMapping
          .map(({ key, alias }) =>
            key in doc
              ? `<Data name="${escapeXml(alias)}"><value>${escapeXml(doc[key])}</value></Data>`
              : ''
          )
          .join('');
      } else {
        dataEntries = Object.keys(doc)
          .map(
            (key) =>
              `<Data name="${escapeXml(key)}"><value>${escapeXml(
                doc[key]
              )}</value></Data>`
          )
          .join('');
      }

      const urlData = `<Data name="url"><value>${escapeXml(url)}</value></Data>`;

      return `<Placemark>
<name>${escapeXml(name)}</name>
<Point><coordinates>${lon},${lat},${alt}</coordinates></Point>
<ExtendedData>${dataEntries}${urlData}</ExtendedData>
</Placemark>`;
    })
    .join('');

/**
 * Close the KML document structure.
 *
 * @returns {string} KML epilogue string
 */
const epilogue = () => '</Document></kml>';

module.exports = {
  contentType,
  fileExtension,
  prologue,
  serializeBatch,
  epilogue,
};
