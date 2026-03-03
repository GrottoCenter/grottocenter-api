const DocumentService = require('./DocumentService');
const NameService = require('./NameService');
const SearchService = require('./SearchService');
const DescriptionService = require('./DescriptionService');
const CommonService = require('./CommonService');

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

const FIND_CAVES_IN_MASSIF = `
  SELECT c.*
  FROM t_cave AS c
  JOIN t_massif as m
  ON ST_Contains(ST_SetSRID(m.geog_polygon::geometry, 4326), ST_SetSRID(ST_MakePoint(c.longitude, c.latitude), 4326))
  WHERE m.id = $1
  AND c.is_deleted = false
`;

const COUNT_ENTRANCES_IN_MASSIF = `
  SELECT COUNT(e.id)::integer AS count
  FROM t_entrance AS e
  JOIN t_massif AS m
  ON e.point_geom && m.geog_polygon AND ST_Contains(m.geog_polygon::geometry, e.point_geom)
  WHERE m.id = $1
  AND e.is_deleted = false
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
      return 0;
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
};
