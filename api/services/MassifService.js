const DocumentService = require('./DocumentService');
const NameService = require('./NameService');
const SearchService = require('./SearchService');
const DescriptionService = require('./DescriptionService');
const CommonService = require('./CommonService');
const coerceBool = require('../utils/coerceBool');

const MAX_AREA_KM2 = 35000;

const FIND_NETWORKS_IN_MASSIF = `
  SELECT c.*, c.length AS "caveLength", count(e.id_cave) as "nbEntrances"
  FROM t_entrance AS e
  LEFT JOIN t_cave c ON c.id = e.id_cave
  WHERE c.is_deleted = false
  AND ST_Contains((SELECT geog_polygon::geometry FROM t_massif WHERE id = $1 ), e.point_geom)
  GROUP BY c.id
  HAVING count(e.id_cave) > 1
`;

// Spatial queries below route through t_entrance to leverage the GiST index on
// point_geom. A cave with no entrance will not appear in these results, which
// is acceptable because every cave in the domain model must have at least one
// entrance.
const FIND_CAVES_IN_MASSIF = `
  SELECT DISTINCT c.*
  FROM t_cave AS c
  JOIN t_entrance AS e ON e.id_cave = c.id
  JOIN t_massif AS m ON m.id = $1
  WHERE ST_Contains(m.geog_polygon::geometry, e.point_geom)
  AND c.is_deleted = false
  AND e.is_deleted = false
`;

const COUNT_ENTRANCES_IN_MASSIF = `
  SELECT COUNT(e.id)::integer AS count
  FROM t_entrance AS e
  JOIN t_massif AS m
  ON e.point_geom && m.geog_polygon AND ST_Contains(m.geog_polygon::geometry, e.point_geom)
  WHERE m.id = $1
  AND e.is_deleted = false
`;

const COUNT_UNSENSITIVE_ENTRANCES_IN_MASSIF = `
  SELECT COUNT(e.id)::integer AS count
  FROM t_entrance AS e
  JOIN t_massif AS m
  ON e.point_geom && m.geog_polygon AND ST_Contains(m.geog_polygon::geometry, e.point_geom)
  WHERE m.id = $1
  AND e.is_deleted = false
  AND e.is_sensitive = false
`;

async function safeDBQuery(sql, param) {
  try {
    const queryResult = await CommonService.query(sql, [param]);
    return queryResult.rows;
  } catch (e) {
    return []; // Fail silently (happens when the longitude and latitude are null for example)
  }
}

module.exports = {
  MAX_AREA_KM2,

  /**
   * Compute the area of a polygon in square kilometers using PostGIS geodesic calculation.
   * Handles both POLYGON and MULTIPOLYGON (sums all parts).
   * @param {string} wktPolygon - WKT representation of the polygon
   * @returns {Promise<number>} area in km²
   */
  async computePolygonAreaKm2(wktPolygon) {
    const query = `SELECT ST_Area($1::geography) / 1000000 AS area_km2`;
    const result = await CommonService.query(query, [wktPolygon]);
    return parseFloat(result.rows[0].area_km2);
  },

  getConvertedDataFromClientRequest: (req) => ({
    caves: req.param('caves'),
    descriptions: req.param('descriptions'),
    documents: req.param('documents'),
    geogPolygon: req.param('geogPolygon'),
    names: req.param('names'),
    isSensitive: coerceBool(req, 'isSensitive'),
  }),

  async getPopulatedMassif(massifId) {
    const massif = await TMassif.findOne(massifId)
      .populate('author')
      .populate('reviewer')
      .populate('names')
      .populate('documents');

    if (!massif) return null;

    [massif.networks, massif.documents, massif.geoJson, massif.descriptions] =
      await Promise.all([
        module.exports.getNetworks(massif.id),
        DocumentService.getDocuments(massif.documents.map((d) => d.id)),
        module.exports.wktToGeoJson(massif.geogPolygon),
        DescriptionService.getMassifDescriptions(massif.id),
      ]);

    await NameService.setNames(massif.networks, 'cave');

    return massif;
  },

  async deleteInSearch(massifId) {
    await SearchService.deleteDocument('massifs', massifId);
  },

  async updateInSearch(populatedMassif) {
    const { documents, networks, names, ...m } = populatedMassif;
    const nbEntrances = await module.exports.countEntrances(m.id);
    const massif = {
      id: m.id,
      dateInscription: m.dateInscription,
      dateReviewed: m.dateReviewed,
      authorId: m.author.id,
      author: m.author.nickname,
      reviewerId: m.reviewer?.id,
      reviewer: m.reviewer?.nickname,

      // Will still have the previous name as the front make a second API call to update the name
      // TODO Change, the API should update the name itself in single API call
      name: names?.[0]?.name,
      language: names?.[0]?.language,
      nbEntrances,
    };
    await SearchService.updateDocument('massifs', massif);
  },

  getCaves: async (massifId) => safeDBQuery(FIND_CAVES_IN_MASSIF, massifId),
  countEntrances: async (massifId) => {
    try {
      const result = await CommonService.query(COUNT_ENTRANCES_IN_MASSIF, [
        massifId,
      ]);
      return result.rows[0]?.count ?? 0;
    } catch (e) {
      sails.log.error(`Error counting entrances for massif ${massifId}:`, e);
      throw e;
    }
  },
  countUnsensitiveEntrances: async (massifId) => {
    try {
      const result = await CommonService.query(
        COUNT_UNSENSITIVE_ENTRANCES_IN_MASSIF,
        [massifId]
      );
      return result.rows[0]?.count ?? 0;
    } catch (e) {
      sails.log.error(
        `Error counting unsensitive entrances for massif ${massifId}:`,
        e
      );
      throw e;
    }
  },
  getNetworks: async (massifId) =>
    safeDBQuery(FIND_NETWORKS_IN_MASSIF, massifId),

  geoJsonToWKT: async (geoJson) => {
    const query = `SELECT ST_AsText($1) `;
    const queryResult = await CommonService.query(query, [
      JSON.stringify(geoJson),
    ]);
    return queryResult.rows[0].st_astext;
  },

  wktToGeoJson: async (geometry) => {
    const query = `SELECT ST_AsGeoJSON($1)`;
    const queryResult = await CommonService.query(query, [geometry]);
    return queryResult.rows[0].st_asgeojson;
  },

  /**
   * Check if a point (lat, long) is within a massif marked as sensitive.
   * @param {number} latitude
   * @param {number} longitude
   * @returns {Promise<boolean>}
   */
  async isPointInSensitiveMassif(latitude, longitude) {
    if (latitude == null || longitude == null) return false;
    try {
      const query = `
        SELECT EXISTS (
          SELECT 1
          FROM t_massif 
          WHERE is_sensitive = true 
          AND is_deleted = false
          AND geog_polygon && ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
          AND ST_Contains(geog_polygon::geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))
        ) as is_sensitive;
      `;
      const result = await CommonService.query(query, [longitude, latitude]);
      return result.rows[0].is_sensitive;
    } catch (e) {
      sails.log.error(
        `Error checking point sensitivity for lat=${latitude}, long=${longitude}:`,
        e
      );
      throw e;
    }
  },

  /**
   * Set the sensitivity status of a massif and propagate it to all entrances within it.
   * Returns the IDs of entrances that were updated, so the caller can refresh
   * the search index without introducing a circular dependency.
   * @param {number} reviewerId
   * @returns {Promise<number[]>} IDs of entrances whose sensitivity was changed
   */
  async setSensitivity(massifId, isSensitive, reviewerId) {
    // 1. Update the massif itself
    await TMassif.updateOne({ id: massifId }).set({
      isSensitive,
      reviewer: reviewerId,
      dateReviewed: new Date(),
    });

    // 2. If setting to sensitive, propagate to all entrances geographically within it
    if (isSensitive) {
      // Find IDs of non-sensitive entrances within the massif
      const findEntrancesQuery = `
        SELECT e.id
        FROM t_entrance AS e
        JOIN t_massif AS m ON m.id = $1
        WHERE e.is_deleted = false
        AND e.point_geom && m.geog_polygon
        AND ST_Contains(m.geog_polygon::geometry, e.point_geom)
        AND e.is_sensitive = false
      `;
      const result = await CommonService.query(findEntrancesQuery, [massifId]);
      const entranceIds = result.rows.map((r) => r.id);

      if (entranceIds.length > 0) {
        await TEntrance.update({ id: entranceIds }).set({ isSensitive: true });
      }

      return entranceIds;
    }

    return [];
  },
};
