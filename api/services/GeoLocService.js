/**
 */

const PUBLIC_ENTRIES_IN_BOUNDS =
  'SELECT e.Id as id, e.Name as name, e.City as city, ' +
  'e.Region as region, e.Longitude as longitude, e.Latitude as latitude, ' +
  'e.Quality as quality, e.Id_cave as idCave, c.Name as nameCave, c.Depth as dephtCave, ' +
  'c.Length as lengthCave, se.Depth as depthSE, se.Length as lengthSE ' +
  'from t_entry as e ' +
  'inner join t_single_entry as se on se.Id=e.Id ' +
  'LEFT JOIN t_cave as c ON c.Id = e.Id_cave ' +
  "WHERE e.Latitude > $1 AND e.Latitude < $2 AND e.Longitude > $3 AND e.Longitude < $4 AND e.Is_public='YES' " +
  'ORDER BY Quality DESC ' +
  'LIMIT $5; ';

const CAVES_IN_BOUNDS =
  'SELECT c.Id as id, c.Name as name, avg(en.Longitude) as longitude, avg(en.Latitude) as latitude ' +
  'FROM t_entry as en ' +
  'INNER JOIN t_cave c on c.Id = en.Id_cave ' +
  "WHERE en.Latitude > $1 AND en.Latitude < $2 AND en.Longitude > $3 AND en.Longitude < $4 AND en.Is_public='YES' " +
  'GROUP BY c.Id, c.Name;';

const PUBLIC_ENTRIES_AVG_COORDS_WITHOUT_QUALITY_ENTRY =
  'SELECT count(t1.Id) as count, avg(t1.Latitude) as latitude, avg(t1.Longitude) as longitude ' +
  'FROM t_entry as t1 ' +
  'LEFT JOIN (SELECT * ' +
  'FROM t_entry ' +
  "WHERE Latitude > $5 AND Latitude < $6 AND Longitude > $7 AND Longitude < $8 AND Is_public='YES' " +
  'ORDER BY Quality DESC ' +
  'LIMIT $9) as t2 on t1.Id = t2.Id ' +
  "WHERE t1.Latitude > $1 AND t1.Latitude < $2 AND t1.Longitude > $3 AND t1.Longitude < $4 AND t1.Is_public='YES' " +
  'AND t2.Id IS NULL; ';

module.exports = {
  /**
   * @returns {Promise} which resolves to the succesfully countEntries
   */
  countEntries: (southWestBound, northEastBound) =>
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
      parameters.isPublic = 'YES';

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
   * Return all the entries in the bounds
   * @param southWestBound
   * @param northEastBound
   * @returns {Promise<any>}
   */
  getEntriesBetweenCoords: (southWestBound, northEastBound) =>
    new Promise((resolve, reject) => {
      CommonService.query(PUBLIC_ENTRIES_IN_BOUNDS, [
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
   * Return the Quality entries in the bounds
   * Quality entry stand for an entry that won't be clustered
   * @param southWestBound
   * @param northEastBound
   * @param qualityLimit
   * @returns {Promise<any>}
   */
  getQualityEntriesBetweenCoords: (
    southWestBound,
    northEastBound,
    qualityLimit,
  ) =>
    new Promise((resolve, reject) => {
      CommonService.query(PUBLIC_ENTRIES_IN_BOUNDS, [
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

      TGrotto.find(parameters).exec((err, result) => {
        if (err) {
          reject(err);
        }
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
      CommonService.query(PUBLIC_ENTRIES_AVG_COORDS_WITHOUT_QUALITY_ENTRY, [
        southWestBound.lat,
        northEastBound.lat,
        southWestBound.lng,
        northEastBound.lng,
        southWestGlobalBound.lat,
        northEastGlobalBound.lat,
        southWestGlobalBound.lng,
        northEastGlobalBound.lng,
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
            sails.log.debug('no entry found in the sub Partition');
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
      GeoLocService.countEntries(southWestBound, northEastBound).then(
        () => {
          // count doesn't take count of the quality entries that are removed
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
   * format the quality entries in a light version of the entries
   * Quality entry stand for an entry that won't be clustered
   * @param entries
   * @returns {Promise<any>}
   */
  formatQualityEntriesMap: (entries) =>
    entries.map((entry) => {
      let entryCave;

      if (entry.idCave) {
        entryCave = {
          id: entry.idCave,
          name: entry.nameCave,
          depth: entry.depthCave,
          length: entry.lengthCave,
        };
      } else {
        entryCave = {
          depth: entry.depthSE,
          length: entry.lengthSE,
        };
      }

      return {
        id: entry.id,
        name: entry.name,
        city: entry.city,
        region: entry.region,
        cave: entryCave,
        longitude: entry.longitude,
        latitude: entry.latitude,
        quality: entry.quality,
      };
    }),

  /**
   * return a light version of the grottos
   * @param grottos
   */
  formatGrottos: (grottos) => {
    grottos.map((grotto) => {
      return {
        id: grotto.id,
        name: grotto.name,
        address: grotto.address,
        longitude: grotto.longitude,
        latitude: grotto.latitude,
      };
    });
  },

  /**
   * format the quality entries with the groups of entries and the grotto
   * @param formattedQualityEntries
   * @param formattedGroupEntry
   * @param formattedGrottos
   */
  formatEntriesMap: (
    formattedQualityEntries,
    formattedGroupEntry,
    formattedGrottos,
    formattedCaves,
  ) => {
    return {
      qualityEntriesMap: formattedQualityEntries,
      groupEntriesMap: formattedGroupEntry,
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
   * Return the entries, the caves, the groups and the clusters of entries in certain bounds and at specific level of zoom,
   * Depending of the zoom level, the clustering behaviour will change.
   * @param southWestBound
   * @param northEastBound
   * @param zoom : Zoom of the leaflet Map
   * @param limitEntries : Maximum number of entries that will be showed at a certain level of zoom
   * @returns {Promise<any>}
   */
  getEntriesMap: (southWestBound, northEastBound, zoom, limitEntries) =>
    new Promise((resolve, reject) => {
      let qualityEntriesMap = [];
      let groupEntriesMap = [];
      let grottoMap = [];
      let caveMap = [];
      const getEntriesPromiseList = [];

      if (zoom > 11) {
        // no clustering
        getEntriesPromiseList.push(
          GeoLocService.getEntriesBetweenCoords(southWestBound, northEastBound)
            .then((entries) => {
              qualityEntriesMap = GeoLocService.formatQualityEntriesMap(
                entries,
              );
            })
            .catch((err) => {
              reject(err);
            }),
        );
      } else if (zoom > 9) {
        getEntriesPromiseList.push(
          GeoLocService.getQualityEntriesBetweenCoords(
            southWestBound,
            northEastBound,
            limitEntries,
          )
            .then((entries) => {
              qualityEntriesMap = GeoLocService.formatQualityEntriesMap(
                entries,
              );
            })
            .catch((err) => {
              sails.log.error(err);
            }),
        );

        getEntriesPromiseList.push(
          GeoLocService.findByBoundsPartitioned(
            southWestBound,
            northEastBound,
            limitEntries,
          )
            .then((partResult) => {
              groupEntriesMap = partResult;
            })
            .catch((err) => {
              sails.log.error(err);
            }),
        );
      } else {
        getEntriesPromiseList.push(
          GeoLocService.findByBoundsPartitioned(
            southWestBound,
            northEastBound,
            0,
          )
            .then((partResult) => {
              groupEntriesMap = partResult;
            })
            .catch((err) => {
              sails.log.error(err);
            }),
        );
      }

      getEntriesPromiseList.push(
        GeoLocService.getGrottoBetweenCoords(southWestBound, northEastBound)
          .then((grottos) => {
            grottoMap = GeoLocService.formatGrottos(grottos);
          })
          .catch((err) => {
            reject(err);
          }),
      );

      getEntriesPromiseList.push(
        GeoLocService.getCaves(southWestBound, northEastBound)
          .then((caves) => {
            caveMap = GeoLocService.formatCaves(caves);
          })
          .catch((err) => {
            sails.log.error(err);
          }),
      );

      Promise.all(getEntriesPromiseList).then(() => {
        resolve(
          GeoLocService.formatEntriesMap(
            qualityEntriesMap,
            groupEntriesMap,
            grottoMap,
            caveMap,
          ),
        );
      });
    }),
};
