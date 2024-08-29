const DocumentService = require('./DocumentService');
const NameService = require('./NameService');
const ElasticsearchService = require('./ElasticsearchService');
const DescriptionService = require('./DescriptionService');
const CommonService = require('./CommonService');

const FIND_NETWORKS_IN_MASSIF = `
  SELECT c.*, c.length AS "caveLength", count(e.id_cave) as "nbEntrances"
  FROM t_entrance AS e
  LEFT JOIN t_cave c ON c.id = e.id_cave
  WHERE c.is_deleted = false
  AND ST_Contains(ST_SetSRID((SELECT geog_polygon::geometry FROM t_massif WHERE id = $1 ), 4326), ST_SetSRID(ST_MakePoint(e.longitude, e.latitude), 4326))
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

async function safeDBQuery(sql, param) {
  try {
    const queryResult = await CommonService.query(sql, [param]);
    return queryResult.rows;
  } catch (e) {
    return []; // Fail silently (happens when the longitude and latitude are null for example)
  }
}

module.exports = {
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

    [
      massif.entrances,
      massif.networks,
      massif.documents,
      massif.geoJson,
      massif.descriptions,
    ] = await Promise.all([
      module.exports.getEntrances(massif.id),
      module.exports.getNetworks(massif.id),
      DocumentService.getDocuments(massif.documents.map((d) => d.id)),
      module.exports.wktToGeoJson(massif.geogPolygon),
      DescriptionService.getMassifDescriptions(massif.id),
    ]);

    await Promise.all([
      NameService.setNames(massif.entrances, 'entrance'),
      NameService.setNames(massif.networks, 'cave'),
    ]);

    return massif;
  },

  async createESMassif(populatedMassif) {
    const description =
      populatedMassif.descriptions.length === 0
        ? null
        : `${populatedMassif.descriptions[0].title} ${populatedMassif.descriptions[0].body}`;
    const { cave, name, names, ...newMassifESData } = populatedMassif;
    await ElasticsearchService.create('massifs', populatedMassif.id, {
      ...newMassifESData,
      name: populatedMassif.names[0].name, // There is only one name at the creation time
      names: populatedMassif.names.map((n) => n.name).join(', '),
      'nb caves': populatedMassif.networks.length,
      'nb entrances': populatedMassif.entrances.length,
      deleted: populatedMassif.isDeleted,
      descriptions: [description],
      tags: ['massif'],
    });
  },

  getCaves: async (massifId) => safeDBQuery(FIND_CAVES_IN_MASSIF, massifId),
  getEntrances: async (massifId) =>
    safeDBQuery(FIND_ENTRANCES_IN_MASSIF, massifId),
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
