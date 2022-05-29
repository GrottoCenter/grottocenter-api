const FIND_NETWORKS_IN_MASSIF = `
  SELECT c.*
  FROM t_entrance AS e
  LEFT JOIN t_cave c ON c.id = e.id_cave
  WHERE c.is_deleted = false
  AND ST_Contains((SELECT geog_polygon FROM t_massif WHERE id = $1 ), ST_MakePoint(c.longitude, c.latitude) )
  GROUP BY c.id
  HAVING count(e.id_cave) > 1
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

  setNetworks: async (massif) => {
    const queryResult = await CommonService.query(FIND_NETWORKS_IN_MASSIF, [
      massif.id,
    ]);
    if (!queryResult || queryResult.rowCount === 0) {
      return [];
    }

    // Build TCave model
    const networkIds = queryResult.rows.map((r) => r.id);
    const networks = await TCave.find({ id: { in: networkIds } });
    massif.networks = networks; // eslint-disable-line no-param-reassign
    return massif;
  },

  getCaves: async (massifId) => {
    const query = `
    SELECT c.*
    FROM t_cave AS c
    JOIN t_massif as m 
    ON ST_Contains(m.geog_polygon, ST_MakePoint(c.longitude, c.latitude) )
    WHERE m.id = $1 
  `;

    const queryResult = await CommonService.query(query, [massifId]);
    return queryResult.rows;
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
