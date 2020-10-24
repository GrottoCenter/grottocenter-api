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

const CAVES_IN_BOUNDS = `
  SELECT c.id as id, nc.name as name, avg(en.longitude) as longitude, avg(en.latitude) as latitude  
  FROM t_entrance as en  
  INNER JOIN t_cave c ON c.id = en.id_cave 
  LEFT JOIN t_name AS nc ON nc.id_cave = c.id
  WHERE en.latitude > $1 AND en.latitude < $2 AND en.longitude > $3 AND en.longitude < $4 AND en.is_public=true
  GROUP BY c.id, nc.name
`;

const PUBLIC_ENTRANCES_AVG_COORDS_WITHOUT_QUALITY_ENTRANCE = `
  SELECT count(t1.Id) as count, avg(t1.latitude) as latitude, avg(t1.longitude) as longitude  
  FROM t_entrance as t1  
  LEFT JOIN (
    SELECT e.*
    FROM t_entrance AS e
    LEFT JOIN t_cave AS c ON c.id = e.id_cave
    WHERE e.latitude > $5 AND e.latitude < $6 AND e.longitude > $7 AND e.longitude < $8 AND e.is_public=true
    ORDER BY size_coef DESC  
    LIMIT $9
  ) as t2 on t1.id = t2.id 
  WHERE t1.latitude > $1 AND t1.latitude < $2 AND t1.longitude > $3 AND t1.longitude < $4 AND t1.is_public=true
  AND t2.id IS NULL; 
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
   * @returns {Promise<any>}
   */
  getEntrancesBetweenCoords: (southWestBound, northEastBound) =>
    new Promise((resolve, reject) => {
      CommonService.query(PUBLIC_ENTRANCES_IN_BOUNDS, [
        southWestBound.lat,
        northEastBound.lat,
        southWestBound.lng,
        northEastBound.lng,
        99999999,
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
   * Return the quality entrances in the bounds
   * Quality entrance stand for an entrance that won't be clustered
   * @param southWestBound
   * @param northEastBound
   * @param qualityLimit
   * @returns {Promise<any>}
   */
  getQualityEntrancesBetweenCoords: (
    southWestBound,
    northEastBound,
    qualityLimit,
  ) =>
    new Promise((resolve, reject) => {
      CommonService.query(PUBLIC_ENTRANCES_IN_BOUNDS, [
        southWestBound.lat,
        northEastBound.lat,
        southWestBound.lng,
        northEastBound.lng,
        qualityLimit,
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
   * Return one cluster for the bounds
   * @param southWestGlobalBound
   * @param northEastGlobalBound
   * @param southWestBound
   * @param northEastBound
   * @param qualityLimit
   * @returns {Promise<any>}
   */
  getGroupedItem: (
    southWestGlobalBound,
    northEastGlobalBound,
    southWestBound,
    northEastBound,
    qualityLimit,
  ) =>
    new Promise((resolve, reject) => {
      CommonService.query(
        PUBLIC_ENTRANCES_AVG_COORDS_WITHOUT_QUALITY_ENTRANCE,
        [
          southWestBound.lat,
          northEastBound.lat,
          southWestBound.lng,
          northEastBound.lng,
          southWestGlobalBound.lat,
          northEastGlobalBound.lat,
          southWestGlobalBound.lng,
          northEastGlobalBound.lng,
          qualityLimit,
        ],
      ).then(
        (results) => {
          if (
            !results ||
            results.rows.length <= 0 ||
            results.rows[0].count === 0
          ) {
            resolve([]);
          }

          resolve([
            {
              number: results.rows[0].count,
              latitude: results.rows[0].latitude,
              longitude: results.rows[0].longitude,
            },
          ]);
        },
        (err) => {
          reject(err);
        },
      );
    }),

  /**
   * Divide The map in subZones in order to do the clustering
   * @param southWestBound
   * @param northEastBound
   * @param qualityLimit
   * @returns {Promise<any>}
   */
  findByBoundsPartitioned: (southWestBound, northEastBound, qualityLimit) =>
    new Promise((resolve, reject) => {
      const settingsPromiseList = [];
      let rowNumber; // Default value
      let columnNumber; // Default value
      let minGroupSize; // Default value
      settingsPromiseList.push(
        SettingsService.getSetting('map.partition.row').then((value) => {
          rowNumber = value;
        }),
      );
      settingsPromiseList.push(
        SettingsService.getSetting('map.partition.column').then((value) => {
          columnNumber = value;
        }),
      );
      settingsPromiseList.push(
        SettingsService.getSetting('map.partition.group.minsize').then(
          (value) => {
            minGroupSize = value;
          },
        ),
      );

      Promise.all(settingsPromiseList).then(() => {
        const mapLon = northEastBound.lng - southWestBound.lng;
        const mapLar = northEastBound.lat - southWestBound.lat;
        const partLon = mapLon / columnNumber;
        const partLar = mapLar / rowNumber;
        const promiseList = [];
        for (let i = 0; i < columnNumber; i += 1) {
          for (let j = 0; j < rowNumber; j += 1) {
            const startLat = Number(southWestBound.lat) + j * partLar;
            const startLng = Number(southWestBound.lng) + i * partLon;
            const stopLat = Number(southWestBound.lat) + j * partLar + partLar;
            const stopLng = Number(southWestBound.lng) + i * partLon + partLon;

            promiseList.push(
              GeoLocService.findByBoundsPartitionedSub(
                southWestBound,
                northEastBound,
                {
                  lat: startLat,
                  lng: startLng,
                },
                {
                  lat: stopLat,
                  lng: stopLng,
                },
                minGroupSize,
                qualityLimit,
              ),
            );
          }
        }
        Promise.all(promiseList)
          .then((values) => {
            const results = [];
            values.forEach((items) => {
              items.forEach((details) => {
                results.push(details);
              });
            });
            resolve(results);
          })
          .catch((err) => {
            sails.log.debug('No entrance found in the sub partition');
            reject(err);
          });
      });
    }),

  findByBoundsPartitionedSub: (
    southWestGlobalBound,
    northEastGlobalBound,
    southWestBound,
    northEastBound,
    minGroupSize,
    qualityLimit,
  ) =>
    new Promise((resolve, reject) => {
      GeoLocService.countEntrances(southWestBound, northEastBound).then(
        () => {
          // count doesn't take count of the quality entrances that are removed
          GeoLocService.getGroupedItem(
            southWestGlobalBound,
            northEastGlobalBound,
            southWestBound,
            northEastBound,
            qualityLimit,
          )
            .then((group) => {
              // sails.log.debug('Grouping ' + count + ' items on partition', southWestBound, northEastBound);
              resolve(group);
            })
            .catch((err) => {
              reject(err);
            });
        },
        (err) => {
          reject(err);
        },
      );
    }),

  /**
   * Format the quality entrances in a lighter version
   * Quality entrance stand for an entrance that won't be clustered
   * @param entrances
   * @returns {Promise<any>}
   */
  formatQualityEntrancesMap: (entrances) =>
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
   * Format the quality entrances with the groups of entrances and the grottos
   * @param formattedQualityEntrances
   * @param formattedGroupEntrance
   * @param formattedGrottos
   */
  formatEntrancesMap: (
    formattedQualityEntrances,
    formattedGroupEntrance,
    formattedGrottos,
    formattedCaves,
  ) => {
    return {
      qualityEntrancesMap: formattedQualityEntrances,
      groupEntrancesMap: formattedGroupEntrance,
      grottos: formattedGrottos,
      caves: formattedCaves,
    };
  },

  /**
   * return a light version of the caves
   * @param cave
   */
  formatCaves: (caves) => {
    return caves.map((cave) => {
      return {
        id: cave.id,
        name: cave.name,
        longitude: cave.longitude,
        latitude: cave.latitude,
      };
    });
  },

  /**
   * Return the entrances, the caves, the groups and the clusters of entrances in certain bounds and at specific level of zoom,
   * Depending of the zoom level, the clustering behaviour will change.
   * @param southWestBound
   * @param northEastBound
   * @param zoom : Zoom of the leaflet Map
   * @param limitEntrances : Maximum number of entrances that will be showed at a certain level of zoom
   * @returns {Promise<any>}
   */
  getEntrancesMap: (southWestBound, northEastBound, zoom, limitEntrances) =>
    new Promise((resolve, reject) => {
      let qualityEntrancesMap = [];
      let groupEntrancesMap = [];
      let grottoMap = [];
      let caveMap = [];
      const getEntrancesPromiseList = [];

      if (zoom > 11) {
        // no clustering
        getEntrancesPromiseList.push(
          GeoLocService.getEntrancesBetweenCoords(
            southWestBound,
            northEastBound,
          )
            .then((entrances) => {
              qualityEntrancesMap = GeoLocService.formatQualityEntrancesMap(
                entrances,
              );
            })
            .catch((err) => {
              reject(err);
            }),
        );
      } else if (zoom > 9) {
        getEntrancesPromiseList.push(
          GeoLocService.getQualityEntrancesBetweenCoords(
            southWestBound,
            northEastBound,
            limitEntrances,
          )
            .then((entrances) => {
              qualityEntrancesMap = GeoLocService.formatQualityEntrancesMap(
                entrances,
              );
            })
            .catch((err) => {
              sails.log.error(err);
            }),
        );

        getEntrancesPromiseList.push(
          GeoLocService.findByBoundsPartitioned(
            southWestBound,
            northEastBound,
            limitEntrances,
          )
            .then((partResult) => {
              groupEntrancesMap = partResult;
            })
            .catch((err) => {
              sails.log.error(err);
            }),
        );
      } else {
        getEntrancesPromiseList.push(
          GeoLocService.findByBoundsPartitioned(
            southWestBound,
            northEastBound,
            0,
          )
            .then((partResult) => {
              groupEntrancesMap = partResult;
            })
            .catch((err) => {
              sails.log.error(err);
            }),
        );
      }

      getEntrancesPromiseList.push(
        GeoLocService.getGrottoBetweenCoords(southWestBound, northEastBound)
          .then((grottos) => {
            grottoMap = GeoLocService.formatGrottos(grottos);
          })
          .catch((err) => {
            reject(err);
          }),
      );

      getEntrancesPromiseList.push(
        GeoLocService.getCaves(southWestBound, northEastBound)
          .then((caves) => {
            caveMap = GeoLocService.formatCaves(caves);
          })
          .catch((err) => {
            sails.log.error(err);
          }),
      );

      Promise.all(getEntrancesPromiseList).then(() => {
        resolve(
          GeoLocService.formatEntrancesMap(
            qualityEntrancesMap,
            groupEntrancesMap,
            grottoMap,
            caveMap,
          ),
        );
      });
    }),
};
