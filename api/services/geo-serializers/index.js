/**
 * Geo Serializer Registry
 *
 * Maps format strings to their respective serializer modules and provides
 * a shared filterDocuments utility for removing sensitive or coordinate-less
 * entries before serialization.
 */

const geojson = require('./geojson');
const kml = require('./kml');
const gpx = require('./gpx');

const serializers = {
  geojson,
  kml,
  gpx,
};

/**
 * Remove entries that are sensitive or lack valid coordinates.
 *
 * Filters out documents where:
 * - isSensitive === true
 * - latitude is null or undefined
 * - longitude is null or undefined
 *
 * @param {Array} documents - Array of entrance documents from Typesense
 * @returns {Array} Filtered array of documents safe for geo export
 */
const filterDocuments = (documents) =>
  documents.filter(
    (doc) =>
      doc.isSensitive !== true && doc.latitude != null && doc.longitude != null
  );

module.exports = {
  serializers,
  filterDocuments,
};
