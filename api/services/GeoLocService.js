const PUBLIC_ENTRANCES_IN_BOUNDS = `
  SELECT e.id as id, ne.name as name, e.city as city,
  e.region as region, e.longitude as longitude, e.latitude as latitude,
  c.size_coef as size_coef, e.id_cave as idCave, nc.name as nameCave, c.depth as depthCave,
  c.length as lengthCave
  FROM t_entrance as e
  LEFT JOIN t_name as ne ON ne.id_entrance = e.id
  LEFT JOIN t_name as nc ON nc.id_cave = e.id_cave
  LEFT JOIN t_cave as c ON c.Id = e.id_cave
  WHERE e.latitude > $1 AND e.latitude < $2 AND e.longitude > $3 AND e.longitude < $4
  AND e.is_sensitive = false
  AND e.is_deleted = false
  ORDER BY size_coef DESC
  LIMIT $5;
`;
const PUBLIC_ENTRANCES_COORDINATES_IN_BOUNDS = `
  SELECT e.longitude as longitude, e.latitude as latitude
  FROM t_entrance as e
  WHERE e.latitude > $1 AND e.latitude < $2 AND e.longitude > $3 AND e.longitude < $4
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
  WHERE en.latitude > $1 AND en.latitude < $2 AND en.longitude > $3 AND en.longitude < $4
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
  WHERE en.latitude > $1 AND en.latitude < $2 AND en.longitude > $3 AND en.longitude < $4
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

// ====================================

module.exports = {
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

    // TODO : to adapt when authentication will be implemented
    parameters.isSensitive = false;
    return TEntrance.count(parameters);
  },

  getEntrancesCoordinates: async (
    southWestBound,
    northEastBound,
    limitEntrances
  ) => {
    const results = await CommonService.query(
      PUBLIC_ENTRANCES_COORDINATES_IN_BOUNDS,
      [
        southWestBound.lat,
        northEastBound.lat,
        southWestBound.lng,
        northEastBound.lng,
        limitEntrances,
      ]
    );
    if (!results || results.rows.length <= 0 || results.rows[0].count === 0) {
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
        southWestBound.lat,
        northEastBound.lat,
        southWestBound.lng,
        northEastBound.lng,
        limitNetworks,
      ]
    );
    if (!results || results.rows.length <= 0 || results.rows[0].count === 0) {
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
  getEntrancesMap: async (southWestBound, northEastBound, limitEntrances) => {
    const results = await CommonService.query(PUBLIC_ENTRANCES_IN_BOUNDS, [
      southWestBound.lat,
      northEastBound.lat,
      southWestBound.lng,
      northEastBound.lng,
      limitEntrances,
    ]);
    if (!results || results.rows.length <= 0 || results.rows[0].count === 0) {
      return [];
    }
    return formatEntrances(results.rows);
  },

  getGrottosMap: async (southWestBound, northEastBound) => {
    const parameters = {
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
      southWestBound.lat,
      northEastBound.lat,
      southWestBound.lng,
      northEastBound.lng,
    ]);
    if (!results || results.rows.length <= 0 || results.rows[0].count === 0) {
      return [];
    }
    return formatNetworks(results.rows);
  },
};
