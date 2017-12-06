'use strict';
/**
 * Mapper for API V1 models
 *
 * BE CAREFULL Any change here must be reported on file apiV1.yaml!
 */

/* Models */

const EntryModel = {
  id: undefined,
  name: undefined
};

const PublicEntry = {
  count: undefined
};

const SearchResult = {
  id: undefined,
  name: undefined
};

/* Mappers */

module.exports = {
  convertToEntryModel: function(source) {
    let result = Object.assign({}, EntryModel);
    //console.log('Source : ' + JSON.stringify(source));
    result.id = source.id;
    result.name = source.name;
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
      entries.push(entry);
    });
    return entries;
  }
};
