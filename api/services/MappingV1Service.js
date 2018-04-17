'use strict';
/**
 * Mapper for API V1 models
 *
 * BE CAREFULL Any change here must be reported on file apiV1.yaml!
 */

/* Models */

const EntryModel = {
  id: undefined,
  name: undefined,
  country: undefined,
  county: undefined,
  region: undefined,
  city: undefined,
  postalCode : undefined,
  latitude: undefined,
  longitude: undefined,
  altitude: undefined
};

const CountResult = {
  count: undefined
};

/* Mappers */

module.exports = {
  convertToEntryModel: function(source) {
    let result = Object.assign({}, EntryModel);
    //console.log('Source : ' + JSON.stringify(source));
    result.id = source.id;
    result.name = source.name;
    result.country = source.country;
    result.county = source.county;
    result.region = source.region;
    result.city = source.city;
    result.postalCode = source.postalCode;
    result.latitude = source.latitude;
    result.longitude = source.longitude;
    result.altitude = source.altitude;
    return result;
  },

  convertToCountResult: function(source) {
    let result = Object.assign({}, CountResult);
    result.count = source.count;
    return result;
  },

  convertToSearchResult: function(source) {
    let results = {};
    let entries = [];
    source.forEach((item) => {
      let entry = this.convertToEntryModel(item);
      entries.push(entry);
    });
    results.entries = entries;
    return results;
  }
};
