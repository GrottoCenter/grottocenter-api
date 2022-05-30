const FIND_NETWORKS_IN_MASSIF = `
  SELECT c.*
  FROM t_entrance AS e
  LEFT JOIN t_cave c ON c.id = e.id_cave
  WHERE c.is_deleted = false
  AND ST_Contains(ST_SetSRID((SELECT geog_polygon::geometry FROM t_massif WHERE id = $1 ), 4326), ST_SetSRID(ST_MakePoint(c.longitude, c.latitude), 4326))
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

const FIND_ENTRANCES_IN_MASSIF = `
  SELECT e.*
  FROM t_entrance AS e
  JOIN t_massif as m 
  ON ST_Contains(ST_SetSRID(m.geog_polygon::geometry, 4326), ST_SetSRID(ST_MakePoint(e.longitude, e.latitude), 4326))
  WHERE m.id = $1 
  AND e.is_deleted = false
`;

const CommonService = require('./CommonService');

module.exports = {
  getConvertedDataFromClientRequest: (req) => ({
    caves: req.param('caves'),
    descriptions: req.param('descriptions'),
    documents: req.param('documents'),
    geogPolygon: req.param('geogPolygon'),
    names: req.param('names'),
  }),

  getCaves: async (massifId) => {
    try {
      const queryResult = await CommonService.query(FIND_CAVES_IN_MASSIF, [
        massifId,
      ]);
      return queryResult.rows;
    } catch (e) {
      return []; // Fail silently (happens when the longitude and latitude are null for example)
    }
  },

  getEntrances: async (massifId) => {
    try {
      const queryResult = await CommonService.query(FIND_ENTRANCES_IN_MASSIF, [
        massifId,
      ]);
      return queryResult.rows;
    } catch (e) {
      return []; // Fail silently (happens when the longitude and latitude are null for example)
    }
  },

  getNetworks: async (massifId) => {
    try {
      const queryResult = await CommonService.query(FIND_NETWORKS_IN_MASSIF, [
        massifId,
      ]);
      return queryResult.rows;
    } catch (e) {
      return []; // Fail silently (happens when the longitude and latitude are null for example)
    }
  },

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
