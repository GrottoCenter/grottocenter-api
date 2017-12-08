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

const PublicEntry = {
  count: undefined
};

const SearchResult = {
  id: undefined,
  name: undefined,
  region: undefined,
  latitude: undefined,
  longitude: undefined,
  altitude: undefined
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

  convertToPublicEntryModel: function(source) {
    let result = Object.assign({}, PublicEntry);
    result.count = source.count;
    return result;
  },

  convertToSearchResult: function(source) {
    let entries = [];
    source.forEach((item) => {
      let entry = Object.assign({}, SearchResult);
      entry.id = item.id;
      entry.name = item.name;
      entry.region = item.region;
      entry.latitude = item.latitude;
      entry.longitude = item.longitude;
      entry.altitude = item.altitude;
      entries.push(entry);
    });
    return entries;
  }
};
