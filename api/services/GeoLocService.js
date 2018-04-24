'use strict';

// Methods for map search
const PUBLIC_ENTRIES_AVG_COORDS = 'SELECT count(Id) as count, avg(Longitude) as longitude, avg(Latitude) as latitude '
  + 'FROM t_entry WHERE Latitude > ? AND Latitude < ? AND Longitude > ? AND Longitude < ? AND Is_public=\'YES\'';

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

      TEntry.find(parameters).exec(function(err, result) {
        if (err) {
          reject(err);
        }
        resolve(result);
      });
    });
  },

  getGroupedItem: function(northWestBound, southEastBound) {
    return new Promise((resolve, reject) => {
      CommonService.query(TEntry, PUBLIC_ENTRIES_AVG_COORDS, [northWestBound.lat, southEastBound.lat, northWestBound.lng, southEastBound.lng])
      .then(function(results) {
        if (!results) {
          reject('No data found');
        }
        resolve([{
          id: results[0].count,
          latitude: results[0].latitude,
          longitude: results[0].longitude,
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

        Promise.all(promiseList).then(function(values) {
          let results = [];
          values.forEach(function(items) {
            items.forEach(function(details) {
              results.push(details);
            });
          });
          resolve(results);
        }, function(err) {
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
          }, function(err) {
            reject(err);
          });
        } else {
          GeoLocService.getEntriesBetweenCoords(northWestBound, southEastBound)
          .then(function(entries) {
            //sails.log.debug('Retrieving ' + entries.length + ' items on partition', northWestBound, southEastBound);
            resolve(entries);
          }, function(err) {
            reject(err);
          });
        }
      }, function(err) {
        reject(err);
      });
    });
  }
};
