/**
 * GeoJSON Serializer
 *
 * Converts entrance documents into a GeoJSON FeatureCollection with Point geometries.
 * Conforms to RFC 7946: coordinates are [longitude, latitude] order.
 *
 * All document fields are included in Feature properties, plus a `url` property
 * linking back to the entrance page on Grottocenter.
 */

const contentType = 'application/geo+json';
const fileExtension = 'geojson';

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
 * @param {Array|null} fieldMapping - Optional array of {key, alias} for field selection/renaming
 * @returns {string} JSON string of a Feature object
 */
const serializeFeature = (doc, fieldMapping) => {
  let properties;
  if (fieldMapping) {
    properties = {};
    fieldMapping.forEach(({ key, alias }) => {
      if (key in doc) {
        properties[alias] = doc[key];
      }
    });
  } else {
    properties = { ...doc };
  }
  properties.url = `https://grottocenter.org/ui/entrances/${doc.id}`;

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
 * @param {Array|null} fieldMapping - Optional array of {key, alias} for field selection/renaming
 * @returns {string} Comma-separated Feature JSON fragments
 */
const serializeBatch = (documents, isFirst, fieldMapping = null) => {
  if (documents.length === 0) {
    return '';
  }
  const features = documents.map((doc) => serializeFeature(doc, fieldMapping));
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
