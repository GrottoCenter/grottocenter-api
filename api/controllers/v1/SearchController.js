'use strict';

const searchController = require('../SearchController');
const ElasticSearch = require('../../services/ElasticsearchService');

const advancedSearchTypes = ['massifs','entries', 'grottos', 'bbs'];

module.exports = {

  search: function(req, res) {
    // Store every params in the url and check if the query parameter exists
    const paramsURl = req.query;
    if(!paramsURl.query){
      return res.badRequest();
    }

    // By default, the query asked will send every information.
    // We can limit these information just by adding a "complete" parameter to false in the query.
    let complete = true;
    if (paramsURl.complete==='false' || paramsURl.complete===false){
      complete = false;
    }

    const params = {
      searchedItem: 'search entity with the following query : '+req.query,
    };
  
    // Use the Elasticsearch Service to do the search according to the parameters of the URL
    ElasticSearch.searchQuery(paramsURl)
      .then(results => {
        if(complete) {
          return ControllerService.treatAndConvert(req, undefined, results, params, res, MappingV1Service.convertToCompleteSearchResult);
        } else {
          return ControllerService.treatAndConvert(req, undefined, results, params, res, MappingV1Service.convertEsToSearchResult);
        }
      })
      .catch(err => {
        return ControllerService.treatAndConvert(req, err, undefined, params, res, MappingV1Service.convertEsToSearchResult);
      });
  },

  /**
   * Perform an advanced search using multiple URL parameters : 
   * - type: string, entity type to search for (@see advancedSearchTypes) (NEEDED)
   * - complete: bool, determine if the results must be returned in their entirely or just their id and name (default = false) (FACULTATIVE)
   * - match_all_queries: bool, determine if the results need to match all the queries (logic AND) or at least of them (logic OR) (default = true) (FACULTATIVE)
   */
  advancedSearch: function(req, res) {
    // Store every params in the url and check if there is the type parameter
    const paramsURL = req.query;

    if(!advancedSearchTypes.includes(paramsURL.resourceType)){
      return res.badRequest();
    }

    // By default, the query asked will send every information.
    let complete = true;
    if (paramsURL.complete && paramsURL.complete === 'false'){
      complete = false;
    }

    const params = {};
  
    // Use the Elasticsearch Service to do the search according to the parameters of the URL
    ElasticSearch.advancedSearchQuery(paramsURL)
      .then(results => {
        if(complete) {
          return ControllerService.treatAndConvert(req, undefined, results, params, res, MappingV1Service.convertToCompleteSearchResult);
        } else {
          return ControllerService.treatAndConvert(req, undefined, results, params, res, MappingV1Service.convertEsToSearchResult);
        }
      })
      .catch(err => {
        return ControllerService.treatAndConvert(req, err, undefined, params, res, MappingV1Service.convertEsToSearchResult);
      });
  },

  findAll: function(req, res) {
    return searchController.findAll(req, res, MappingV1Service.convertDbToSearchResult);
  },

};
