/**
 * GeoJSON Serializer
 *
 * Converts entrance documents into a GeoJSON FeatureCollection with Point geometries.
 * Conforms to RFC 7946: coordinates are [longitude, latitude] order.
 *
 * All document fields are included in Feature properties, plus a `grottocenterUrl` property
 * linking back to the entrance page on Grottocenter.
 *
 * Documents are pre-mapped by the controller: when field selection is active,
 * only aliased fields (plus id, latitude, longitude) are present. The serializer
 * excludes geometry/id fields from properties to honour the field-selection contract.
 *
 * NOTE: The top-level `name`, `description`, and `timestamp` are non-standard
 * FeatureCollection properties (RFC 7946 defines only `type`, `features`, `bbox`).
 * They are informational extras that most GIS tools tolerate; strict parsers may
 * ignore them.
 */

const contentType = 'application/geo+json';
const fileExtension = 'geojson';

/**
 * Fields used for geometry construction that should not appear in Feature properties.
 */
const GEOMETRY_FIELDS = ['id', 'latitude', 'longitude', 'altitude'];

/**
 * Produces the opening structure of the GeoJSON FeatureCollection.
 *
 * @param {string} timestamp - ISO 8601 UTC timestamp of export generation
 * @returns {string} Opening JSON fragment
 */
const prologue = (timestamp) =>
  `{"type":"FeatureCollection","name":"Grottocenter","description":"Exported from https://grottocenter.org","timestamp":"${timestamp}","features":[`;

/**
 * Serializes a single entrance document into a GeoJSON Feature object.
 *
 * @param {object} doc - Entrance document from Typesense
 * @returns {string} JSON string of a Feature object
 */
const serializeFeature = (doc) => {
  const properties = {};
  Object.keys(doc).forEach((key) => {
    if (!GEOMETRY_FIELDS.includes(key)) {
      properties[key] = doc[key];
    }
  });
  properties.grottocenterUrl = `https://grottocenter.org/ui/entrances/${doc.id}`;

  const feature = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [doc.longitude, doc.latitude],
    },
    properties,
  };
  return JSON.stringify(feature);
};

/**
 * Serializes a batch of entrance documents into GeoJSON Feature strings.
 *
 * @param {Array} documents - Array of filtered entrance documents
 * @param {boolean} isFirst - Whether this is the first batch (no leading comma)
 * @returns {string} Comma-separated Feature JSON fragments
 */
const serializeBatch = (documents, isFirst) => {
  if (documents.length === 0) {
    return '';
  }
  const features = documents.map((doc) => serializeFeature(doc));
  const joined = features.join(',');
  return isFirst ? joined : `,${joined}`;
};

/**
 * Produces the closing structure of the GeoJSON FeatureCollection.
 *
 * @returns {string} Closing JSON fragment
 */
const epilogue = () => ']}';

module.exports = {
  contentType,
  fileExtension,
  prologue,
  serializeBatch,
  epilogue,
};
