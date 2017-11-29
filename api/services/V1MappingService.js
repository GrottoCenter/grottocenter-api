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

};

const SearchResult = {

};

/* Mappers */

module.exports = {
  convertToEntryModel: function(source) {
    let result = Object.assign({}, EntryModel);
    result.id = source.id;
    result.name = source.name;
    return result;
  },

  convertToPublicEntryModel: function(source) {
    let result = Object.assign({}, PublicEntry);
    return result;
  },

  convertToSearchResult: function(source) {
    let result = Object.assign({}, SearchResult);
    return result;
  }
};
