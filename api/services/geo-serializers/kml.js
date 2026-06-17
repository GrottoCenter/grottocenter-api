/**
 * KML Serializer
 *
 * Converts entrance documents into a KML document with Point Placemarks.
 * Produces valid KML 2.2 with namespace http://www.opengis.net/kml/2.2.
 *
 * Each entrance becomes a <Placemark> with:
 * - <name> from the document's name field
 * - <Point><coordinates>lon,lat[,alt]</coordinates></Point>
 * - <ExtendedData> with <Data> elements for all document fields plus grottocenterUrl
 *
 * Documents are pre-mapped by the controller: when field selection is active,
 * only aliased fields (plus id, latitude, longitude) are present. The serializer
 * excludes geometry/id fields from <ExtendedData> to honour the field-selection contract.
 */

const { escapeXml } = require('./xml-utils');

const contentType = 'application/vnd.google-earth.kml+xml';
const fileExtension = 'kml';

/**
 * Fields used for geometry construction that should not appear in <ExtendedData>.
 */
const GEOMETRY_FIELDS = ['id', 'latitude', 'longitude', 'altitude', 'name'];

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
 * @returns {string} KML Placemark elements
 */
const serializeBatch = (documents, _isFirst) =>
  documents
    .map((doc) => {
      const name = doc.name != null ? doc.name : '';
      const lon = doc.longitude;
      const lat = doc.latitude;
      const url = `https://grottocenter.org/ui/entrances/${doc.id}`;

      // Omit altitude when unknown rather than defaulting to 0 (sea level)
      const coords =
        doc.altitude != null
          ? `${escapeXml(String(lon))},${escapeXml(String(lat))},${escapeXml(String(doc.altitude))}`
          : `${escapeXml(String(lon))},${escapeXml(String(lat))}`;

      const dataEntries = Object.keys(doc)
        .filter((key) => !GEOMETRY_FIELDS.includes(key))
        .map(
          (key) =>
            `<Data name="${escapeXml(key)}"><value>${escapeXml(
              doc[key]
            )}</value></Data>`
        )
        .join('');

      const urlData = `<Data name="grottocenterUrl"><value>${escapeXml(url)}</value></Data>`;

      return `<Placemark>
<name>${escapeXml(name)}</name>
<Point><coordinates>${coords}</coordinates></Point>
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
