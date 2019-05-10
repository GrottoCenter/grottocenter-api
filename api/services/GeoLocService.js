'use strict';

// Methods for map search
const PUBLIC_ENTRIES_AVG_COORDS = 'SELECT count(Id) as count, avg(Longitude) as longitude, avg(Latitude) as latitude '
  + 'FROM t_entry WHERE Latitude > $1 AND Latitude < $2 AND Longitude > $3 AND Longitude < $4 AND Is_public=\'YES\'';

const PUBLIC_ENTRIES_AVG_COORDS_WITHOUT_QUALITY_ENTRY =
  'SELECT count(t1.Id) as count, avg(t1.Latitude) as latitude, avg(t1.Longitude) as longitude ' +
  'FROM t_entry as t1 ' +
  'LEFT JOIN (SELECT * ' +
  'FROM t_entry ' +
  'WHERE Latitude > $5 AND Latitude < $6 AND Longitude > $7 AND Longitude < $8 AND Is_public=\'YES\' ' +
  'ORDER BY Quality DESC ' +
  'LIMIT $9) as t2 on t1.Id = t2.Id ' +
  'WHERE t1.Latitude > $1 AND t1.Latitude < $2 AND t1.Longitude > $3 AND t1.Longitude < $4 AND t1.Is_public=\'YES\' ' +
  'AND t2.Id IS NULL ';

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

  getEntriesBetweenCoords: function(southWestBound, northEastBound) {
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

      TEntry.find(parameters)
        .populate('cave')
        .sort('quality DESC')
        .exec(function(err, result) {
        if (err) {
          reject(err);
        }
        resolve(result);
      });
    });
  },

  getQualityEntriesBetweenCoords: function(southWestBound, northEastBound, qualityLimit) {
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

      TEntry.find(parameters)
        .populate('cave')
        .sort('quality DESC')
        .limit(qualityLimit)
        .exec(function(err, result) {
          if (err) {
            reject(err);
          }
          resolve(result);
        });
    });
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
        let mapLon = CommonService.difference(southWestBound.lng,  northEastBound.lng);
        let mapLar = CommonService.difference(southWestBound.lat, northEastBound.lat);
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
          /*if (count >= minGroupSize) {
            GeoLocService.getGroupedItem(southWestGlobalBound, northEastGlobalBound, southWestBound, northEastBound, qualityLimit)
              .then(function(group) {
                //sails.log.debug('Grouping ' + count + ' items on partition', southWestBound, northEastBound);
                resolve(group);
              })
              .catch(function(err) {
                reject(err);
              });
          } else {
            GeoLocService.getEntriesBetweenCoords(southWestBound, northEastBound)
              .then(function(entries) {
                //sails.log.debug('Retrieving ' + entries.length + ' items on partition', southWestBound, northEastBound);
                resolve(entries);
              })
              .catch(function(err) {
                reject(err);
              });
          }*/
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
      if (entry.cave) {
        entryCave =
          {
            id: entry.cave.id,
            name: entry.cave.name,
            depth: entry.cave.depth
          }
      } else {
        entryCave = null;
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
        address: grotto.address
      }

    });
  },

  /**
   * format the group entries
   * @param entries
   * @returns {Promise<any>}
   */
  formatGroupEntriesMap: function (entries){
    return entries.map(function(entry) {
      let entryCave;
      if (entry.cave) {
        entryCave =
          {
            id: entry.cave.id,
            name: entry.cave.name,
            depth: entry.cave.depth
          }
      } else {
        entryCave = null;
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
   * format the quality entries with the groups of entries and the grotto
   * @param formattedQualityEntries
   * @param formattedGroupEntry
   * @param formattedGrottos
   */
  formatEntriesMap: function(formattedQualityEntries, formattedGroupEntry, formattedGrottos){
    return {
      qualityEntriesMap: formattedQualityEntries,
      groupEntriesMap: formattedGroupEntry,
      grottos: formattedGrottos
    };
  },



  /**
   *
   * @param southWestBound
   * @param northEastBound
   * @param limitEntries
   * @returns {Promise<any>}
   */
  getEntriesMap: function (southWestBound, northEastBound, limitEntries) {
    sails.log.debug("début getEntriesMap");

    return new Promise((resolve, reject)=>{

      this.countEntries(southWestBound, northEastBound)
        .then(function(result){
          if (!result){
            resolve(GeoLocService.formatEntriesMap([], [], []))
          }

          if (result > limitEntries){
            let qualityEntriesMap = [];
            let groupEntriesMap = [];
            let grottoMap = [];
            let getEntriesPromiseList = [];
            getEntriesPromiseList.push(GeoLocService.getQualityEntriesBetweenCoords(southWestBound, northEastBound, limitEntries)
              .then(function(partResult) {
                qualityEntriesMap = partResult;
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

            getEntriesPromiseList.push(GeoLocService.getGrottoBetweenCoords(southWestBound, northEastBound)
              .then(function (grottos) {
                grottoMap = grottos;
              })
              .catch(function (err) {
                reject(err);
              }));

            Promise.all(getEntriesPromiseList).then(function (values) {
              const formattedEntries = GeoLocService.formatQualityEntriesMap(qualityEntriesMap);
              const formattedGrottos = GeoLocService.formatGrottos(grottoMap);
              resolve(GeoLocService.formatEntriesMap(formattedEntries, groupEntriesMap, formattedGrottos));
            });

          } else {
            let qualityEntriesMap = [];
            let groupEntriesMap = [];
            let grottoMap = [];
            let getEntriesPromiseList = [];

            getEntriesPromiseList.push(GeoLocService.getEntriesBetweenCoords(southWestBound, northEastBound)
              .then(function (entries) {
                qualityEntriesMap = entries;
              })
              .catch(function (err) {
                reject(err);
              }));

            getEntriesPromiseList.push(GeoLocService.getGrottoBetweenCoords(southWestBound, northEastBound)
              .then(function (grottos) {
                grottoMap = grottos;
              })
              .catch(function (err) {
                reject(err);
              }));

            Promise.all(getEntriesPromiseList).then(function (values) {
              const formattedEntries = GeoLocService.formatQualityEntriesMap(qualityEntriesMap);
              const formattedGrottos = GeoLocService.formatGrottos(grottoMap);
              resolve(GeoLocService.formatEntriesMap(formattedEntries, groupEntriesMap, formattedGrottos));
            });

          }

        })
        .catch(function (err) {
          sails.log.error(err);
          return res.serverError('Call to countEntries raised an error : ' + err);
        });


    });
  }

};
