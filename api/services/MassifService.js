const DocumentService = require('./DocumentService');
const NameService = require('./NameService');
const SearchService = require('./SearchService');
const DescriptionService = require('./DescriptionService');
const CommonService = require('./CommonService');
const coerceBool = require('../utils/coerceBool');

const MAX_AREA_KM2 = 35000;

// Maps PostGIS/GEOS error keywords to structured error responses.
// Each entry is [keyword to match, error code, user-facing message].
// Error codes follow the pattern: POLYGON_<CATEGORY>
const POLYGON_ERROR_MESSAGES = [
  // ST_IsValid failures (GEOS)
  [
    'Self-intersection',
    'POLYGON_SELF_INTERSECTION',
    'The polygon edges cross each other. Please redraw without self-intersections.',
  ],
  [
    'Too few points',
    'POLYGON_TOO_FEW_POINTS',
    'The polygon does not have enough points. A valid polygon needs at least 4 coordinates.',
  ],
  [
    'Hole lies outside shell',
    'POLYGON_HOLE_OUTSIDE',
    'A hole is located outside the outer boundary. Please ensure all holes are within the polygon.',
  ],
  [
    'Nested holes',
    'POLYGON_NESTED_HOLES',
    'The polygon contains holes within holes. Please flatten the hole structure.',
  ],
  [
    'Disconnected interior',
    'POLYGON_DISCONNECTED',
    'The polygon interior is split into disconnected parts. Please draw it as separate polygons.',
  ],
  [
    'Duplicate Rings',
    'POLYGON_DUPLICATE_RINGS',
    'The polygon contains duplicate rings. Please remove the repeated boundary.',
  ],
  // ST_Area geography failures (PostGIS XX000)
  [
    'lwgeom_area_spher',
    'POLYGON_INVALID_WINDING',
    'The polygon rings have an invalid winding order. Exterior rings must be counter-clockwise and holes must be clockwise.',
  ],
  [
    'Antipodal',
    'POLYGON_ANTIPODAL_EDGE',
    'The polygon contains an edge that spans exactly 180°. Please split it into smaller segments.',
  ],
  [
    'crosses equator',
    'POLYGON_CROSSES_EQUATOR',
    'The polygon contains a ring that crosses the equator. Please split it into separate northern and southern polygons.',
  ],
];

const POLYGON_AREA_EXCEEDED = 'POLYGON_AREA_EXCEEDED';
const POLYGON_INVALID = 'POLYGON_INVALID';

/**
 * Find the first matching error for a raw PostGIS/GEOS error string.
 * Note: keyword matching is case-sensitive and relies on PostGIS/GEOS error
 * wording which is stable within a major version but could change across
 * upgrades. Re-verify keyword casing when upgrading PostGIS.
 * @param {string} raw - raw error string to match against
 * @returns {{ code: string, message: string }} structured error
 */
function matchPolygonError(raw) {
  const match = POLYGON_ERROR_MESSAGES.find(([keyword]) =>
    raw.includes(keyword)
  );
  if (match) {
    return { code: match[1], message: match[2] };
  }
  return {
    code: POLYGON_INVALID,
    message:
      'The polygon could not be processed. Please simplify or redraw it.',
  };
}

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
  AND e.is_sensitive_locked = false
`;

// Counts non-sensitive entrances within the massif whose sensitivity is locked.
// These are the entrances the cascade will skip.
const COUNT_LOCKED_UNSENSITIVE_ENTRANCES_IN_MASSIF = `
  SELECT COUNT(e.id)::integer AS count
  FROM t_entrance AS e
  JOIN t_massif AS m
  ON e.point_geom && m.geog_polygon AND ST_Contains(m.geog_polygon::geometry, e.point_geom)
  WHERE m.id = $1
  AND e.is_deleted = false
  AND e.is_sensitive = false
  AND e.is_sensitive_locked = true
`;

// Spatial queries using ST_Contains can throw when point_geom is null rather than
// returning an empty result set. This wrapper normalises that to an empty array.
async function querySpatialRows(sql, param) {
  try {
    const queryResult = await CommonService.query(sql, [param]);
    return queryResult.rows;
  } catch (e) {
    return [];
  }
}

module.exports = {
  MAX_AREA_KM2,
  matchPolygonError,

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

  /**
   * Validate a polygon's geometry and area constraints.
   * Checks basic validity (ST_IsValid), geographic computability (ST_Area on
   * geography), and maximum area limit.
   * @param {string} wktPolygon - WKT representation of the polygon
   * @returns {Promise<{code: string, message: string}|null>} null if valid, error object if invalid
   */
  async validatePolygon(wktPolygon) {
    // Check basic geometry validity (self-intersections, etc.)
    // ST_IsValidDetail performs a single GEOS pass and returns both the
    // validity flag and the reason, avoiding a redundant traversal.
    const validityQuery = `SELECT valid AS is_valid, reason FROM ST_IsValidDetail($1::geometry)`;
    const validityResult = await CommonService.query(validityQuery, [
      wktPolygon,
    ]);
    const { is_valid: isValid, reason } = validityResult.rows[0];
    if (!isValid) {
      sails.log.warn(`Polygon validation failed (ST_IsValid): ${reason}`);
      return matchPolygonError(reason);
    }

    // Compute area — also catches geometry errors that only manifest when
    // casting to geography (e.g. invalid winding order, antipodal edges).
    // Error structure: Waterline wraps pg errors as OperationalError with
    // e.raw.error being a pg-protocol DatabaseError (has .code, .message,
    // .severity, .routine, etc.). The XX000 code is PostgreSQL's generic
    // "internal_error" used by PostGIS for computation failures.
    // Note: keyword matching depends on PostGIS error wording which could
    // change across versions; the fallback message handles unknown cases.
    let areaKm2;
    try {
      areaKm2 = await module.exports.computePolygonAreaKm2(wktPolygon);
    } catch (e) {
      const pgCode = e.raw && e.raw.error && e.raw.error.code;
      if (pgCode === 'XX000') {
        const pgMessage = (e.raw && e.raw.error && e.raw.error.message) || '';
        sails.log.warn(`Polygon validation failed (XX000): ${pgMessage}`);
        return matchPolygonError(pgMessage);
      }
      throw e;
    }

    if (areaKm2 > MAX_AREA_KM2) {
      return {
        code: POLYGON_AREA_EXCEEDED,
        message: `The massif polygon area (${areaKm2.toFixed(0)} km²) exceeds the maximum allowed size of ${MAX_AREA_KM2} km².`,
      };
    }

    return null;
  },

  getConvertedDataFromClientRequest: (req) => ({
    caves: req.param('caves'),
    descriptions: req.param('descriptions'),
    documents: req.param('documents'),
    geogPolygon: req.param('geogPolygon'),
    names: req.param('names'),
    isSensitive: coerceBool(req, 'isSensitive'),
    isSensitiveLocked: coerceBool(req, 'isSensitiveLocked'),
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

  getCaves: async (massifId) =>
    querySpatialRows(FIND_CAVES_IN_MASSIF, massifId),
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
  countLockedUnsensitiveEntrances: async (massifId) => {
    try {
      const result = await CommonService.query(
        COUNT_LOCKED_UNSENSITIVE_ENTRANCES_IN_MASSIF,
        [massifId]
      );
      return result.rows[0]?.count ?? 0;
    } catch (e) {
      sails.log.error(
        `Error counting locked unsensitive entrances for massif ${massifId}:`,
        e
      );
      throw e;
    }
  },
  getNetworks: async (massifId) =>
    querySpatialRows(FIND_NETWORKS_IN_MASSIF, massifId),

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
   * Propagates sensitivity to all non-sensitive entrances geographically within the massif.
   *
   * Decoupled from `setSensitivity` so new massifs can update child entrances without
   * triggering a redundant TMassif update that creates spurious history logs.
   *
   * @param {number} massifId
   * @param {number} reviewerId
   * @param {object} [db] - optional database connection for transactions
   * @returns {Promise<number[]>} IDs of entrances whose sensitivity was changed
   */
  async propagateSensitivityToEntrances(massifId, reviewerId, db) {
    // Find IDs of non-sensitive entrances within the massif.
    // Entrances whose sensitivity is locked are skipped (left unchanged).
    const findEntrancesQuery = `
      SELECT e.id
      FROM t_entrance AS e
      JOIN t_massif AS m ON m.id = $1
      WHERE e.is_deleted = false
      AND e.point_geom && m.geog_polygon
      AND ST_Contains(m.geog_polygon::geometry, e.point_geom)
      AND e.is_sensitive = false
      AND e.is_sensitive_locked = false
    `;
    const result = await CommonService.query(
      findEntrancesQuery,
      [massifId],
      db
    );
    const entranceIds = result.rows.map((r) => r.id);

    if (entranceIds.length > 0) {
      let updateQuery = TEntrance.update({ id: entranceIds }).set({
        isSensitive: true,
        reviewer: reviewerId,
        dateReviewed: new Date(),
      });
      if (db) {
        updateQuery = updateQuery.usingConnection(db);
      }
      await updateQuery;
      sails.log.info(
        `Massif ${massifId} marked sensitive: converted non-sensitive entrances [${entranceIds.join(
          ', '
        )}] to sensitive.`
      );
    }

    return entranceIds;
  },

  /**
   * Set the sensitivity status of a massif and propagate it to all entrances within it.
   * Returns the IDs of entrances that were updated, so the caller can refresh
   * the search index without introducing a circular dependency.
   *
   * @param {number} massifId - ID of the massif to update
   * @param {boolean} isSensitive - The new sensitivity status
   * @param {number} reviewerId - ID of the admin performing this action
   * @param {object} [db] - optional database connection for transactions
   * @returns {Promise<number[]>} IDs of entrances whose sensitivity was changed
   */
  async setSensitivity(massifId, isSensitive, reviewerId, db) {
    const work = async (connection) => {
      // 1. Update the massif itself
      let updateMassif = TMassif.updateOne({ id: massifId }).set({
        isSensitive,
        reviewer: reviewerId,
        dateReviewed: new Date(),
      });
      if (connection) {
        updateMassif = updateMassif.usingConnection(connection);
      }
      await updateMassif;

      // 2. If setting to sensitive, propagate to all entrances geographically within it
      if (isSensitive) {
        return module.exports.propagateSensitivityToEntrances(
          massifId,
          reviewerId,
          connection
        );
      }

      return [];
    };

    if (db) {
      return work(db);
    }
    return sails.getDatastore().transaction(work);
  },
};
