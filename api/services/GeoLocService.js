'use strict';

const PUBLIC_ENTRIES_IN_BOUNDS =
  'SELECT e.Id as id, e.Name as name, e.City as city, ' +
  'e.Region as region, e.Longitude as longitude, e.Latitude as latitude, ' +
  'e.Quality as quality, e.Id_cave as idCave, c.Name as nameCave, c.Depth as dephtCave, ' +
  'c.Length as lengthCave, se.Depth as depthSE, se.Length as lengthSE ' +
  'from t_entry as e ' +
  'inner join t_single_entry as se on se.Id=e.Id ' +
  'LEFT JOIN t_cave as c ON c.Id = e.Id_cave ' +
  'WHERE e.Latitude > $1 AND e.Latitude < $2 AND e.Longitude > $3 AND e.Longitude < $4 AND e.Is_public=\'YES\' ' +
  'ORDER BY Quality DESC ' +
  'LIMIT $5; ';

const CAVES_IN_BOUNDS =
  'SELECT c.Id as id, c.Name as name, avg(en.Longitude) as longitude, avg(en.Latitude) as latitude ' +
  'FROM t_entry as en ' +
  'INNER JOIN t_cave c on c.Id = en.Id_cave ' +
  'WHERE en.Latitude > $1 AND en.Latitude < $2 AND en.Longitude > $3 AND en.Longitude < $4 AND en.Is_public=\'YES\' ' +
  'GROUP BY c.Id, c.Name;';



const PUBLIC_ENTRIES_AVG_COORDS_WITHOUT_QUALITY_ENTRY =
  'SELECT count(t1.Id) as count, avg(t1.Latitude) as latitude, avg(t1.Longitude) as longitude ' +
  'FROM t_entry as t1 ' +
  'LEFT JOIN (SELECT * ' +
  'FROM t_entry ' +
  'WHERE Latitude > $5 AND Latitude < $6 AND Longitude > $7 AND Longitude < $8 AND Is_public=\'YES\' ' +
  'ORDER BY Quality DESC ' +
  'LIMIT $9) as t2 on t1.Id = t2.Id ' +
  'WHERE t1.Latitude > $1 AND t1.Latitude < $2 AND t1.Longitude > $3 AND t1.Longitude < $4 AND t1.Is_public=\'YES\' ' +
  'AND t2.Id IS NULL; ';

module.exports = {
  /**
   * @returns {Promise} which resolves to the succesfully countEntries
   */
  countEntries: function(southWestBound, northEastBound) {
    return new Promise((resolve, reject) => {
      let parameters = {
        latitude: {
          '>': southWestBound.lat,
          '<': northEastBound.lat
        },
        longitude: {
          '>': southWestBound.lng,
          '<': northEastBound.lng
        }
      }; // TODO add controls on parameters

      //TODO : to adapt when authentication will be implemented
      parameters.isPublic = 'YES';

      TEntry.count(parameters).exec(function(err, result) {
        if (err) {
          reject(err);
        }
        resolve(result);
      });
    });
  },

  //TODO : optimize the request (too slow)
  getMassif: function(southWestBound, northEastBound) {
    return new Promise((resolve, reject) => {
      TMassif.find()
        .populate('entries')
        .exec(function (err, result) {
          if(err){
            reject(err);
          }
          resolve(result);
        })
    });
  },


  getCaves: function(southWestBound, northEastBound){
    return new Promise((resolve,reject) => {
      CommonService.query(CAVES_IN_BOUNDS, [southWestBound.lat, northEastBound.lat, southWestBound.lng, northEastBound.lng])
        .then(function(results) {
          if (!results || results.rows.length <= 0 || results.rows[0].count === 0) {
            resolve([]);
          }
          resolve(results.rows);
        }, function(err) {
          reject(err);
        });
    })
  },

  getEntriesBetweenCoords: function(southWestBound, northEastBound) {
    return new Promise((resolve,reject) => {
      CommonService.query(PUBLIC_ENTRIES_IN_BOUNDS, [southWestBound.lat, northEastBound.lat, southWestBound.lng, northEastBound.lng, 99999999])
        .then(function(results) {
          if (!results || results.rows.length <= 0 || results.rows[0].count === 0) {
            resolve([]);
          }

          resolve(results.rows);
        }, function(err) {
          reject(err);
        });
    })
  },

  getQualityEntriesBetweenCoords: function(southWestBound, northEastBound, qualityLimit) {
    return new Promise((resolve,reject) => {
      CommonService.query(PUBLIC_ENTRIES_IN_BOUNDS, [southWestBound.lat, northEastBound.lat, southWestBound.lng, northEastBound.lng, qualityLimit])
        .then(function(results) {
          if (!results || results.rows.length <= 0 || results.rows[0].count === 0) {
            resolve([]);
          }

          resolve(results.rows);
        }, function(err) {
          reject(err);
        });
    })
  },

  getGrottoBetweenCoords: function(southWestBound, northEastBound) {
    return new Promise((resolve, reject) => {
      let parameters = {
        latitude: {
          '>': southWestBound.lat,
          '<': northEastBound.lat
        },
        longitude: {
          '>': southWestBound.lng,
          '<': northEastBound.lng
        }
      }; // TODO add controls on parameters

      TGrotto.find(parameters)
        .exec(function(err, result) {
          if (err) {
            reject(err);
          }
          resolve(result);
        });
    });
  },

  getGroupedItem: function(southWestGlobalBound, northEastGlobalBound, southWestBound, northEastBound, qualityLimit) {
    return new Promise((resolve, reject) => {
      CommonService.query(PUBLIC_ENTRIES_AVG_COORDS_WITHOUT_QUALITY_ENTRY, [southWestBound.lat, northEastBound.lat, southWestBound.lng, northEastBound.lng, southWestGlobalBound.lat, northEastGlobalBound.lat, southWestGlobalBound.lng, northEastGlobalBound.lng, qualityLimit])
        .then(function(results) {
          if (!results || results.rows.length <= 0 || results.rows[0].count === 0) {
            resolve([]);
          }

          resolve([{
            number: results.rows[0].count,
            latitude: results.rows[0].latitude,
            longitude: results.rows[0].longitude,
          }]);
        }, function(err) {
          reject(err);
        });
    });
  },


  findByBoundsPartitioned: function(southWestBound, northEastBound, qualityLimit) {
    return new Promise((resolve, reject) => {
      let settingsPromiseList = [];
      let rowNumber; // Default value
      let columnNumber; // Default value
      let minGroupSize; // Default value
      settingsPromiseList.push(SettingsService.getSetting('map.partition.row')
        .then(function(value) {
          rowNumber = value;
        }));
      settingsPromiseList.push(SettingsService.getSetting('map.partition.column')
        .then(function(value) {
          columnNumber = value;
        }));
      settingsPromiseList.push(SettingsService.getSetting('map.partition.group.minsize')
        .then(function(value) {
          minGroupSize = value;
        }));

      Promise.all(settingsPromiseList).then(function() {
        let mapLon = northEastBound.lng - southWestBound.lng;
        let mapLar = northEastBound.lat - southWestBound.lat;
        let partLon = mapLon / columnNumber;
        let partLar = mapLar / rowNumber;
        let promiseList = [];
        for (let i = 0; i < columnNumber; i++) {
          for (let j = 0; j < rowNumber; j++) {
            let startLat = Number(southWestBound.lat) + (j * partLar);
            let startLng = Number(southWestBound.lng) + (i * partLon);
            let stopLat = Number(southWestBound.lat) + (j * partLar) + partLar;
            let stopLng = Number(southWestBound.lng) + (i * partLon) + partLon;

            promiseList.push(GeoLocService.findByBoundsPartitionedSub(southWestBound, northEastBound,{
              lat: startLat,
              lng: startLng
            }, {
              lat: stopLat,
              lng: stopLng
            }, minGroupSize, qualityLimit));
          }
        }
        Promise.all(promiseList)
          .then(function(values) {
            let results = [];
            values.forEach(function(items) {
              items.forEach(function(details) {
                results.push(details);
              });
            });
            resolve(results);
          })
          .catch(function(err) {
            sails.log.debug("no entry found in the sub Partition");
            reject(err);
          });
      });
    });
  },

  findByBoundsPartitionedSub: function(southWestGlobalBound, northEastGlobalBound, southWestBound, northEastBound, minGroupSize, qualityLimit) {
    return new Promise((resolve, reject) => {
      GeoLocService.countEntries(southWestBound, northEastBound)
        .then(function(count) {
          /** count doesn't take count of the quality entries that are removed **/
          GeoLocService.getGroupedItem(southWestGlobalBound, northEastGlobalBound, southWestBound, northEastBound, qualityLimit)
            .then(function(group) {
              //sails.log.debug('Grouping ' + count + ' items on partition', southWestBound, northEastBound);
              resolve(group);
            })
            .catch(function(err) {
              reject(err);
            });
        }, function(err) {
          reject(err);
        });
    });
  },

  /**
   * format the "bests" entries in a light version of the entries
   * @param entries
   * @returns {Promise<any>}
   */
  formatQualityEntriesMap: function (entries){
    return entries.map(function(entry) {
      let entryCave;

      if (entry.idCave){
        entryCave =
          {
            id: entry.idCave,
            name: entry.nameCave,
            depth: entry.depthCave,
            length: entry.lengthCave,
          }
      } else {
        entryCave =
          {
            depth: entry.depthSE,
            length: entry.lengthSE,
          }
      }

      return {
        id: entry.id,
        name: entry.name,
        city: entry.city,
        region: entry.region,
        cave: entryCave,
        longitude: entry.longitude,
        latitude: entry.latitude,
        quality: entry.quality
      };
    });
  },

  /**
   * return a light version of the grottos
   * @param grottos
   */
  formatGrottos: function(grottos){
    return grottos.map(function(grotto){
      return {
        id: grotto.id,
        name: grotto.name,
        address: grotto.address,
        longitude: grotto.longitude,
        latitude: grotto.latitude
      }

    });
  },

  /**
   * format the quality entries with the groups of entries and the grotto
   * @param formattedQualityEntries
   * @param formattedGroupEntry
   * @param formattedGrottos
   */
  formatEntriesMap: function(formattedQualityEntries, formattedGroupEntry, formattedGrottos, formattedCaves){
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
  formatCaves: function(caves){
    return caves.map(function(caves){
      return {
        id: caves.id,
        name: caves.name,
        longitude: caves.longitude,
        latitude: caves.latitude,
      }

    });
  },

  /**
   *
   * @param southWestBound
   * @param northEastBound
   * @param limitEntries
   * @returns {Promise<any>}
   */
  getEntriesMap: function (southWestBound, northEastBound, zoom, limitEntries) {
    return new Promise((resolve, reject)=>{
      let qualityEntriesMap = [];
      let groupEntriesMap = [];
      let grottoMap = [];
      let caveMap = [];
      let getEntriesPromiseList = [];

      if (zoom > 11) {  // no clustering
        getEntriesPromiseList.push(GeoLocService.getEntriesBetweenCoords(southWestBound, northEastBound)
          .then(function (entries) {
            qualityEntriesMap = GeoLocService.formatQualityEntriesMap(entries);
          })
          .catch(function (err) {
            reject(err);
          }));
      }else if(zoom > 9){
        getEntriesPromiseList.push(GeoLocService.getQualityEntriesBetweenCoords(southWestBound, northEastBound, limitEntries)
          .then(function(entries) {
            qualityEntriesMap = GeoLocService.formatQualityEntriesMap(entries)
          })
          .catch(function(err) {
            sails.log.error(err);
          }));

        getEntriesPromiseList.push(GeoLocService.findByBoundsPartitioned(southWestBound, northEastBound, limitEntries)
          .then(function(partResult) {
            groupEntriesMap = partResult;
          })
          .catch(function(err) {
            sails.log.error(err);
          }));

      } else {
        getEntriesPromiseList.push(GeoLocService.findByBoundsPartitioned(southWestBound, northEastBound, 0)
          .then(function(partResult) {
            groupEntriesMap = partResult;
          })
          .catch(function(err) {
            sails.log.error(err);
          }));
      }

      getEntriesPromiseList.push(GeoLocService.getGrottoBetweenCoords(southWestBound, northEastBound)
        .then(function (grottos) {
          grottoMap = GeoLocService.formatGrottos(grottos);
        })
        .catch(function (err) {
          reject(err);
        }));

      getEntriesPromiseList.push(GeoLocService.getCaves(southWestBound, northEastBound)
        .then(function(caves) {
          caveMap = GeoLocService.formatCaves(caves);
        })
        .catch(function(err) {
          sails.log.error(err);
        }));

      Promise.all(getEntriesPromiseList).then(function (values) {
        resolve(GeoLocService.formatEntriesMap(qualityEntriesMap, groupEntriesMap, grottoMap, caveMap));
      });
    });
  }

};
