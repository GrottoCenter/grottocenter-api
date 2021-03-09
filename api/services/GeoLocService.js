/**
 */

const PUBLIC_ENTRANCES_IN_BOUNDS = `
  SELECT e.id as id, ne.name as name, e.city as city,
  e.region as region, e.longitude as longitude, e.latitude as latitude,
  c.size_coef as size_coef, e.id_cave as idCave, nc.name as nameCave, c.depth as depthCave,
  c.length as lengthCave
  FROM t_entrance as e
  LEFT JOIN t_name as ne ON ne.id_entrance = e.id
  LEFT JOIN t_name as nc ON nc.id_cave = e.id
  LEFT JOIN t_cave as c ON c.Id = e.Id_cave
  WHERE e.latitude > $1 AND e.latitude < $2 AND e.longitude > $3 AND e.longitude < $4
  AND e.is_public=true
  ORDER BY size_coef DESC
  LIMIT $5;
`;
const PUBLIC_ENTRANCES_COORDINATES_IN_BOUNDS = `
  SELECT e.longitude as longitude, e.latitude as latitude
  FROM t_entrance as e
  WHERE e.latitude > $1 AND e.latitude < $2 AND e.longitude > $3 AND e.longitude < $4
  AND e.is_public=true
  LIMIT $5;
`;

const CAVES_IN_BOUNDS = `
  SELECT c.id as id, COALESCE(nc.name, ne.name) as name, avg(en.longitude) as longitude, avg(en.latitude) as latitude
  FROM t_entrance as en
  INNER JOIN t_cave c ON c.id = en.id_cave
  LEFT JOIN t_name AS nc ON nc.id_cave = c.id
  LEFT JOIN t_name as ne ON ne.id_entrance = en.id
  WHERE en.latitude > $1 AND en.latitude < $2 AND en.longitude > $3 AND en.longitude < $4 AND en.is_public=true
  GROUP BY c.id, nc.name, ne.name
`;

const PUBLIC_CAVES_COORDINATES_IN_BOUNDS = `
  SELECT avg(en.longitude) as longitude, avg(en.latitude) as latitude
  FROM t_entrance as en
  INNER JOIN t_cave c ON c.id = en.id_cave
  WHERE en.latitude > $1 AND en.latitude < $2 AND en.longitude > $3 AND en.longitude < $4 AND en.is_public=true
  GROUP BY c.id
  LIMIT $5;
`;

module.exports = {
  /**
   * @returns {Promise} which resolves to the succesfully countEntrances
   */
  countEntrances: (southWestBound, northEastBound) =>
    new Promise((resolve, reject) => {
      const parameters = {
        latitude: {
          '>': southWestBound.lat,
          '<': northEastBound.lat,
        },
        longitude: {
          '>': southWestBound.lng,
          '<': northEastBound.lng,
        },
      }; // TODO add controls on parameters

      // TODO : to adapt when authentication will be implemented
      parameters.isPublic = true;

      TEntrance.count(parameters).exec((err, result) => {
        if (err) {
          reject(err);
        }
        resolve(result);
      });
    }),

  /**
   * Return the cave in the bounds
   * @param southWestBound
   * @param northEastBound
   * @returns {Promise<any>}
   */
  getCaves: (southWestBound, northEastBound) =>
    new Promise((resolve, reject) => {
      CommonService.query(CAVES_IN_BOUNDS, [
        southWestBound.lat,
        northEastBound.lat,
        southWestBound.lng,
        northEastBound.lng,
      ]).then(
        (results) => {
          if (
            !results ||
            results.rows.length <= 0 ||
            results.rows[0].count === 0
          ) {
            resolve([]);
          }
          resolve(results.rows);
        },
        (err) => {
          reject(err);
        },
      );
    }),

  /**
   * Return all the entrances in the bounds
   * @param southWestBound
   * @param northEastBound
   * @param limit
   * @returns {Promise<any>}
   */
  getEntrancesBetweenCoords: (southWestBound, northEastBound, limit) =>
    new Promise((resolve, reject) => {
      CommonService.query(PUBLIC_ENTRANCES_IN_BOUNDS, [
        southWestBound.lat,
        northEastBound.lat,
        southWestBound.lng,
        northEastBound.lng,
        limit,
      ]).then(
        (results) => {
          if (
            !results ||
            results.rows.length <= 0 ||
            results.rows[0].count === 0
          ) {
            resolve([]);
          }
          resolve(results.rows);
        },
        (err) => {
          reject(err);
        },
      );
    }),

  /**
   * Return all the entrances coordinates in the bounds
   * @param southWestBound
   * @param northEastBound
   * @param limit
   * @returns {Promise<any>}
   */
  getEntrancesCoordinatesInExtend: (southWestBound, northEastBound, limit) =>
    new Promise((resolve, reject) => {
      CommonService.query(PUBLIC_ENTRANCES_COORDINATES_IN_BOUNDS, [
        southWestBound.lat,
        northEastBound.lat,
        southWestBound.lng,
        northEastBound.lng,
        limit,
      ]).then(
        (results) => {
          if (
            !results ||
            results.rows.length <= 0 ||
            results.rows[0].count === 0
          ) {
            resolve([]);
          }
          resolve(results.rows);
        },
        (err) => {
          reject(err);
        },
      );
    }),

  /**
   * Return all the entrances coordinates in the bounds
   * @param southWestBound
   * @param northEastBound
   * @returns {Promise<any>}
   */
  getCavesCoordinatesInExtend: (southWestBound, northEastBound, limit) =>
    new Promise((resolve, reject) => {
      CommonService.query(PUBLIC_CAVES_COORDINATES_IN_BOUNDS, [
        southWestBound.lat,
        northEastBound.lat,
        southWestBound.lng,
        northEastBound.lng,
        limit,
      ]).then(
        (results) => {
          if (
            !results ||
            results.rows.length <= 0 ||
            results.rows[0].count === 0
          ) {
            resolve([]);
          }
          resolve(results.rows);
        },
        (err) => {
          reject(err);
        },
      );
    }),

  /**
   * Return the speleological group in the bounds
   * @param southWestBound
   * @param northEastBound
   * @returns {Promise<any>}
   */
  getGrottoBetweenCoords: (southWestBound, northEastBound) =>
    new Promise((resolve, reject) => {
      const parameters = {
        latitude: {
          '>': southWestBound.lat,
          '<': northEastBound.lat,
        },
        longitude: {
          '>': southWestBound.lng,
          '<': northEastBound.lng,
        },
      }; // TODO add controls on parameters

      TGrotto.find(parameters).exec(async (err, result) => {
        if (err) {
          reject(err);
        }
        await NameService.setNames(result, 'grotto');
        resolve(result);
      });
    }),

  /**
   * Format the quality entrances in a lighter version
   * Quality entrance stand for an entrance that won't be clustered
   * @param entrances
   * @returns {Promise<any>}
   */
  formatEntrances: (entrances) =>
    entrances.map((entrance) => {
      let entranceCave;

      if (entrance.idCave) {
        entranceCave = {
          id: entrance.idCave,
          name: entrance.nameCave,
          depth: entrance.depthCave,
          length: entrance.lengthCave,
        };
      } else {
        entranceCave = {
          depth: entrance.depthSE,
          length: entrance.lengthSE,
        };
      }

      return {
        id: entrance.id,
        name: entrance.name,
        city: entrance.city,
        region: entrance.region,
        cave: entranceCave,
        longitude: parseFloat(entrance.longitude),
        latitude: parseFloat(entrance.latitude),
        quality: entrance.size_coef,
      };
    }),

  /**
   * Return a lighter version of the grottos
   * @param grottos
   */
  formatGrottos: (grottos) =>
    grottos.map((grotto) => ({
      id: grotto.id,
      name: grotto.name,
      address: grotto.address,
      longitude: parseFloat(grotto.longitude),
      latitude: parseFloat(grotto.latitude),
    })),

  /**
   * return a light version of the caves
   * @param caves
   */
  formatCaves: (caves) => {
    return caves.map((cave) => {
      return {
        id: cave.id,
        name: cave.name,
        longitude: Number(cave.longitude),
        latitude: Number(cave.latitude),
      };
    });
  },

  getEntrancesCoordinates: (southWestBound, northEastBound, limitEntrances) =>
    new Promise((resolve, reject) => {
      GeoLocService.getEntrancesCoordinatesInExtend(
        southWestBound,
        northEastBound,
        limitEntrances,
      )
        .then((coordinates) => {
          resolve(
            coordinates.map((coord) => {
              return [Number(coord.longitude), Number(coord.latitude)];
            }),
          );
        })
        .catch((err) => {
          reject(err);
        });
    }),

  getCavesCoordinates: (southWestBound, northEastBound, limitCaves) =>
    new Promise((resolve, reject) => {
      GeoLocService.getCavesCoordinatesInExtend(
        southWestBound,
        northEastBound,
        limitCaves,
      )
        .then((coordinates) => {
          resolve(
            coordinates.map((coord) => {
              return [Number(coord.longitude), Number(coord.latitude)];
            }),
          );
        })
        .catch((err) => {
          reject(err);
        });
    }),

  /**
   * @param southWestBound
   * @param northEastBound
   * @param limitEntrances Max number of entrances that will be showed at a certain level of zoom
   * @returns {Promise<any>}
   */
  getEntrancesMap: (southWestBound, northEastBound, limitEntrances) =>
    new Promise((resolve, reject) => {
      GeoLocService.getEntrancesBetweenCoords(
        southWestBound,
        northEastBound,
        limitEntrances,
      )
        .then((entrances) => {
          resolve(GeoLocService.formatEntrances(entrances));
        })
        .catch((err) => {
          reject(err);
        });
    }),

  /**
   * @param southWestBound
   * @param northEastBound
   * @returns {Promise<any>}
   */
  getGrottosMap: (southWestBound, northEastBound) =>
    new Promise((resolve, reject) => {
      GeoLocService.getGrottoBetweenCoords(southWestBound, northEastBound)
        .then((grottos) => {
          resolve(GeoLocService.formatGrottos(grottos));
        })
        .catch((err) => {
          reject(err);
        });
    }),

  /**
   * @param southWestBound
   * @param northEastBound
   * @returns {Promise<any>}
   */
  getCavesMap: (southWestBound, northEastBound) =>
    new Promise((resolve, reject) => {
      GeoLocService.getCaves(southWestBound, northEastBound)
        .then((caves) => {
          resolve(GeoLocService.formatCaves(caves));
        })
        .catch((err) => {
          reject(err);
        });
    }),
};
