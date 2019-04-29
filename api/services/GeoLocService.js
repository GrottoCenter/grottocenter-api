'use strict';

// Methods for map search
const PUBLIC_ENTRIES_AVG_COORDS = 'SELECT count(Id) as count, avg(Longitude) as longitude, avg(Latitude) as latitude '
  + 'FROM t_entry WHERE Latitude > $1 AND Latitude < $2 AND Longitude > $3 AND Longitude < $4 AND Is_public=\'YES\'';

const PUBLIC_ENTRIES_AVG_COORDS_WITHOUT_QUALITY_ENTRY =
  'SELECT count(t1.Id) as count, avg(t1.Latitude) as latitude, avg(t1.Longitude) as longitude' +
  'FROM t_entry as t1' +
  'LEFT JOIN (SELECT *' +
  'FROM t_entry' +
  'WHERE Latitude > $5 AND Latitude < $6 AND Longitude > $7 AND Longitude < $8 AND Is_public=\'YES\'' +
  'ORDER BY Quality DESC' +
  'LIMIT $9) as t2 on t1.Id = t2.Id' +
  'WHERE t1.Latitude > $1 AND t1.Latitude < $2 AND t1.Longitude > $3 AND t1.Longitude < $4 AND t1.Is_public=\'YES\'' +
  'AND t2.Id IS NULL';

module.exports = {
  /**
   * @returns {Promise} which resolves to the succesfully countEntries
   */
  countEntries: function(northWestBound, southEastBound) {
    return new Promise((resolve, reject) => {
      let parameters = {
        latitude: {
          '>': northWestBound.lat,
          '<': southEastBound.lat
        },
        longitude: {
          '>': northWestBound.lng,
          '<': southEastBound.lng
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

  getEntriesBetweenCoords: function(northWestBound, southEastBound) {
    return new Promise((resolve, reject) => {
      let parameters = {
        latitude: {
          '>': northWestBound.lat,
          '<': southEastBound.lat
        },
        longitude: {
          '>': northWestBound.lng,
          '<': southEastBound.lng
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

  getGroupedItem: function(northWestBound, southEastBound) {
    return new Promise((resolve, reject) => {
      CommonService.query(PUBLIC_ENTRIES_AVG_COORDS, [northWestBound.lat, southEastBound.lat, northWestBound.lng, southEastBound.lng])
        .then(function(results) {
          if (!results || results.rows.length <= 0 || results.rows[0].count === 0) {
            reject('No data found');
          }
          resolve([{
            id: results.rows[0].count,
            latitude: results.rows[0].latitude,
            longitude: results.rows[0].longitude,
            name: 'group'
          }]);
        }, function(err) {
          reject(err);
        });
    });
  },

  findByBoundsPartitioned: function(northWestBound, southEastBound) {
    return new Promise((resolve, reject) => {
      let settingsPromiseList = [];
      let rowNumber = 5; // Default value
      let columnNumber = 6; // Default value
      let minGroupSize = 100; // Default value
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
        let mapLon = CommonService.difference(northWestBound.lng,  southEastBound.lng);
        let mapLar = CommonService.difference(northWestBound.lat, southEastBound.lat);
        let partLon = mapLon / columnNumber;
        let partLar = mapLar / rowNumber;
        let promiseList = [];

        for (let i = 0; i < columnNumber; i++) {
          for (let j = 0; j < rowNumber; j++) {
            let startLat = Number(northWestBound.lat) + (j * partLar);
            let startLng = Number(northWestBound.lng) + (i * partLon);
            let stopLat = Number(northWestBound.lat) + (j * partLar) + partLar;
            let stopLng = Number(northWestBound.lng) + (i * partLon) + partLon;

            promiseList.push(GeoLocService.findByBoundsPartitionedSub({
              lat: startLat,
              lng: startLng
            }, {
              lat: stopLat,
              lng: stopLng
            }, minGroupSize));
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
            reject(err);
          });
      });
    });
  },

  findByBoundsPartitionedSub: function(northWestBound, southEastBound, minGroupSize) {
    return new Promise((resolve, reject) => {
      GeoLocService.countEntries(northWestBound, southEastBound)
        .then(function(count) {
          if (count >= minGroupSize) {
            GeoLocService.getGroupedItem(northWestBound, southEastBound)
              .then(function(group) {
                //sails.log.debug('Grouping ' + count + ' items on partition', northWestBound, southEastBound);
                resolve(group);
              })
              .catch(function(err) {
                reject(err);
              });
          } else {
            GeoLocService.getEntriesBetweenCoords(northWestBound, southEastBound)
              .then(function(entries) {
                //sails.log.debug('Retrieving ' + entries.length + ' items on partition', northWestBound, southEastBound);
                resolve(entries);
              })
              .catch(function(err) {
                reject(err);
              });
          }
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
   * format the quality entries with the groups of entries
   * @param formattedQualityEntries
   * @param formattedGroupEntry
   */
  formatEntriesMap: function(formattedQualityEntries, formattedGroupEntry){
    sails.log.debug(formattedQualityEntries);
    return {
      qualityEntriesMap: formattedQualityEntries,
      groupEntriesMap: formattedGroupEntry
    };
  },


  /**
   *
   * @param northWestBound
   * @param southEastBound
   * @param limitEntries
   * @returns {Promise<any>}
   */
  getEntriesMap: function (northWestBound, southEastBound, limitEntries) {

    return new Promise((resolve, reject)=>{

      this.countEntries(northWestBound, southEastBound)
        .then(function(result){
          if (!result){
            return {};
          }

          if (result > limitEntries){

          } else {
            GeoLocService.getEntriesBetweenCoords(northWestBound, southEastBound)
              .then(function(entries) {
                const formattedEntries = GeoLocService.formatQualityEntriesMap(entries);
                resolve(GeoLocService.formatEntriesMap(formattedEntries, []));
              })
              .catch(function(err) {
                reject(err);
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
