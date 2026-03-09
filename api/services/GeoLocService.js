const PUBLIC_ENTRANCES_IN_BOUNDS = `
  SELECT e.id as id, ne.name as name, e.city as city,
  e.region as region, e.longitude as longitude, e.latitude as latitude,
  c.size_coef as size_coef, e.id_cave as idCave, nc.name as nameCave, c.depth as depthCave,
  c.length as lengthCave
  FROM t_entrance as e
  LEFT JOIN t_name as ne ON ne.id_entrance = e.id
  LEFT JOIN t_name as nc ON nc.id_cave = e.id_cave
  LEFT JOIN t_cave as c ON c.Id = e.id_cave
  WHERE ST_Within(e.point_geom, ST_MakeEnvelope($1, $2, $3, $4, 4326))
  AND e.is_sensitive = false
  AND e.is_deleted = false
  ORDER BY size_coef DESC
  LIMIT $5;
`;

const PUBLIC_ENTRANCES_IN_BOUNDS_AND_MASSIF = `
  SELECT e.id as id, ne.name as name, e.city as city,
  e.region as region, e.longitude as longitude, e.latitude as latitude,
  c.size_coef as size_coef, e.id_cave as idCave, nc.name as nameCave, c.depth as depthCave,
  c.length as lengthCave
  FROM t_entrance as e
  LEFT JOIN t_name as ne ON ne.id_entrance = e.id
  LEFT JOIN t_name as nc ON nc.id_cave = e.id_cave
  LEFT JOIN t_cave as c ON c.Id = e.id_cave
  JOIN t_massif AS m ON m.id = $6
  WHERE ST_Within(e.point_geom, ST_MakeEnvelope($1, $2, $3, $4, 4326))
  AND ST_Contains(m.geog_polygon::geometry, e.point_geom)
  AND e.is_sensitive = false
  AND e.is_deleted = false
  ORDER BY size_coef DESC
  LIMIT $5;
`;
const PUBLIC_ENTRANCES_COORDINATES_IN_BOUNDS = `
  SELECT e.longitude as longitude, e.latitude as latitude
  FROM t_entrance as e
  WHERE ST_Within(e.point_geom, ST_MakeEnvelope($1, $2, $3, $4, 4326))
  AND e.is_sensitive = false
  AND e.is_deleted = false
  LIMIT $5;
`;

const PUBLIC_ENTRANCES_COORDINATES_IN_BOUNDS_AND_MASSIF = `
  SELECT e.longitude AS longitude, e.latitude AS latitude
  FROM t_entrance AS e
  JOIN t_massif AS m ON m.id = $6
  WHERE ST_Within(e.point_geom, ST_MakeEnvelope($1, $2, $3, $4, 4326))
  AND ST_Contains(m.geog_polygon::geometry, e.point_geom)
  AND e.is_sensitive = false
  AND e.is_deleted = false
  LIMIT $5;
`;

const NETWORKS_IN_BOUNDS = `
  SELECT c.id as id, COALESCE(nc.name, ne.name) as name, avg(en.longitude) as longitude, avg(en.latitude) as latitude
  FROM t_entrance as en
  INNER JOIN t_cave c ON c.id = en.id_cave
  LEFT JOIN t_name AS nc ON nc.id_cave = c.id
  LEFT JOIN t_name as ne ON ne.id_entrance = en.id
  WHERE ST_Within(en.point_geom, ST_MakeEnvelope($1, $2, $3, $4, 4326))
  AND en.is_sensitive = false
  AND en.is_deleted = false
  AND c.is_deleted = false
  GROUP BY c.id, COALESCE(nc.name, ne.name)
  HAVING count(en.id_cave) > 1
`;

const PUBLIC_NETWORKS_COORDINATES_IN_BOUNDS = `
  SELECT avg(en.longitude) as longitude, avg(en.latitude) as latitude
  FROM t_cave AS c
  LEFT JOIN t_entrance en ON c.id = en.id_cave
  WHERE ST_Within(en.point_geom, ST_MakeEnvelope($1, $2, $3, $4, 4326))
  AND en.is_sensitive = false
  AND en.is_deleted = false
  AND c.is_deleted = false
  GROUP BY c.id
  HAVING count(en.id_cave) > 1
  LIMIT $5;
`;

const CommonService = require('./CommonService');
const NameService = require('./NameService');

/**
 * return a light version of the networks
 * @param networks
 */
const formatNetworks = (networks) =>
  networks.map((network) => ({
    id: network.id,
    name: network.name,
    longitude: Number(network.longitude),
    latitude: Number(network.latitude),
  }));

/**
 * Format the quality entrances in a lighter version
 * Quality entrance stand for an entrance that won't be clustered
 * @param entrances
 */
const formatEntrances = (entrances) =>
  entrances.map((entrance) => ({
    id: entrance.id,
    name: entrance.name,
    city: entrance.city,
    region: entrance.region,
    caveId: entrance.idcave,
    caveName: entrance.namecave,
    depth: entrance.depthcave,
    length: entrance.lengthcave,
    longitude: parseFloat(entrance.longitude),
    latitude: parseFloat(entrance.latitude),
    quality: entrance.size_coef,
  }));

/**
 * Return a lighter version of the grottos
 * @param grottos
 */
const formatGrottos = (grottos) =>
  grottos.map((grotto) => ({
    id: grotto.id,
    name: grotto.name,
    address: grotto.address,
    longitude: parseFloat(grotto.longitude),
    latitude: parseFloat(grotto.latitude),
  }));

/**
 * Parse and validate the optional `massif` query parameter.
 * Returns { massifId, errorResponse } where errorResponse is null if valid.
 * If errorResponse is not null, the caller should return it immediately.
 */
const checkAndGetMassifParam = async (req, res) => {
  const rawMassifId = req.param('massif', null);
  const massifId = rawMassifId ? parseInt(rawMassifId, 10) : null;

  if (rawMassifId && (!Number.isFinite(massifId) || massifId < 1)) {
    return {
      massifId: null,
      errorResponse: res.badRequest(
        'massif parameter must be a positive integer.'
      ),
    };
  }

  if (massifId) {
    const massif = await TMassif.findOne(massifId);
    if (!massif) {
      return {
        massifId: null,
        errorResponse: res.notFound({
          message: `Massif of id ${massifId} not found.`,
        }),
      };
    }
  }

  return { massifId, errorResponse: null };
};

// ====================================

module.exports = {
  checkAndGetMassifParam,
  checkAndGetCoordinatesParams: (req) => {
    let errorMessage = '';
    const errors = [];
    const neededParams = [
      { key: 'sw_lat', name: 'South west latitude', value: null },
      { key: 'sw_lng', name: 'South west longitude', value: null },
      { key: 'ne_lat', name: 'North east latitude', value: null },
      { key: 'ne_lng', name: 'North east longitude', value: null },
    ];

    const result = neededParams.map((param) => ({
      ...param,
      value: req.param(param.key, null),
    }));

    // Check null values
    const missingParams = result.filter((p) => p.value === null);
    if (missingParams.length > 0) {
      errorMessage = 'You must provide the following parameter(s): ';
      for (const missingParam of missingParams) {
        errors.push(`${missingParam.name} value on key ${missingParam.key}`);
      }
    } else {
      // Check valid values
      for (const param of result) {
        if (
          param.key.endsWith('lat') &&
          (param.value < -90 || param.value > 90)
        ) {
          errors.push(
            `${param.name} value must be between -90 & 90 (value found: ${param.value})`
          );
        }
        if (
          param.key.endsWith('lng') &&
          (param.value < -180 || param.value > 180)
        ) {
          errors.push(
            `${param.name} value must be between -180 & 180 (value found: ${param.value})`
          );
        }
      }
    }

    if (errors.length > 0) errorMessage += `${errors.join(', ')}.`;

    return {
      errorMessage,
      southWestBound: {
        lat: result.find((p) => p.key === 'sw_lat').value,
        lng: result.find((p) => p.key === 'sw_lng').value,
      },
      northEastBound: {
        lat: result.find((p) => p.key === 'ne_lat').value,
        lng: result.find((p) => p.key === 'ne_lng').value,
      },
    };
  },

  countEntrances: async (southWestBound, northEastBound) => {
    const result = await CommonService.query(
      `SELECT count(*) as count FROM t_entrance AS e
       WHERE ST_Within(e.point_geom, ST_MakeEnvelope($1, $2, $3, $4, 4326))
       AND e.is_sensitive = false
       AND e.is_deleted = false`,
      [
        southWestBound.lng,
        southWestBound.lat,
        northEastBound.lng,
        northEastBound.lat,
      ]
    );
    return parseInt(result.rows[0].count, 10);
  },

  getEntrancesCoordinates: async (
    southWestBound,
    northEastBound,
    limitEntrances,
    massifId = null
  ) => {
    const query = massifId
      ? PUBLIC_ENTRANCES_COORDINATES_IN_BOUNDS_AND_MASSIF
      : PUBLIC_ENTRANCES_COORDINATES_IN_BOUNDS;
    const params = [
      southWestBound.lng,
      southWestBound.lat,
      northEastBound.lng,
      northEastBound.lat,
      limitEntrances,
    ];
    if (massifId) {
      params.push(massifId);
    }
    const results = await CommonService.query(query, params);
    if (!results || results.rows.length <= 0) {
      return [];
    }
    const coordinates = results.rows;

    return coordinates.map((coord) => [
      Number(coord.longitude),
      Number(coord.latitude),
    ]);
  },

  getNetworksCoordinates: async (
    southWestBound,
    northEastBound,
    limitNetworks
  ) => {
    const results = await CommonService.query(
      PUBLIC_NETWORKS_COORDINATES_IN_BOUNDS,
      [
        southWestBound.lng,
        southWestBound.lat,
        northEastBound.lng,
        northEastBound.lat,
        limitNetworks,
      ]
    );
    if (!results || results.rows.length <= 0) {
      return [];
    }
    const coordinates = results.rows;
    return coordinates.map((coord) => [
      Number(coord.longitude),
      Number(coord.latitude),
    ]);
  },

  /**
   * @param southWestBound
   * @param northEastBound
   * @param limitEntrances Max number of entrances that will be showed at a certain level of zoom
   * @returns {Promise<any>}
   */
  getEntrancesMap: async (
    southWestBound,
    northEastBound,
    limitEntrances,
    massifId = null
  ) => {
    const query = massifId
      ? PUBLIC_ENTRANCES_IN_BOUNDS_AND_MASSIF
      : PUBLIC_ENTRANCES_IN_BOUNDS;
    const params = [
      southWestBound.lng,
      southWestBound.lat,
      northEastBound.lng,
      northEastBound.lat,
      limitEntrances,
    ];
    if (massifId) {
      params.push(massifId);
    }
    const results = await CommonService.query(query, params);
    if (!results || results.rows.length <= 0) {
      return [];
    }
    return formatEntrances(results.rows);
  },

  getGrottosMap: async (southWestBound, northEastBound) => {
    const parameters = {
      isDeleted: false,
      latitude: {
        '>': southWestBound.lat,
        '<': northEastBound.lat,
      },
      longitude: {
        '>': southWestBound.lng,
        '<': northEastBound.lng,
      },
    };
    const grottos = await TGrotto.find(parameters);
    await NameService.setNames(grottos, 'grotto');
    return formatGrottos(grottos);
  },

  getNetworksMap: async (southWestBound, northEastBound) => {
    const results = await CommonService.query(NETWORKS_IN_BOUNDS, [
      southWestBound.lng,
      southWestBound.lat,
      northEastBound.lng,
      northEastBound.lat,
    ]);
    if (!results || results.rows.length <= 0) {
      return [];
    }
    return formatNetworks(results.rows);
  },
};
