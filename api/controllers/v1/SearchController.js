'use strict';

const searchController = require('../SearchController');
const ElasticSearch = require('../../services/ElasticsearchService');

module.exports = {

  search: function(req, res) {
    // Store every params in the url and check if the query parameter exists
    const paramsURl = req.query;
    if(!paramsURl.query){
      return res.badRequest();
    }

    // By default, the query asked will send every information. We can limit these information just by adding a complete parameter to false in the query
    let complete = true;
    if (paramsURl.complete && paramsURl.complete==='false'){
      complete = false;
    }

    const params = {
      searchedItem: 'search entity with the following query : '+req.query,
    };
  
    // Use the Elasticsearch Service to do the search according to the parameters of the URL
    ElasticSearch.searchQuery(paramsURl).then(results => {
      if(complete) {
        return ControllerService.treatAndConvert(req, undefined, results, params, res, MappingV1Service.convertToCompleteSearchResult);
      } else {
        return ControllerService.treatAndConvert(req, undefined, results, params, res, MappingV1Service.convertToSearchResult);
      }
    }).catch(err => {
      return ControllerService.treatAndConvert(req, err, undefined, params, res, MappingV1Service.convertToSearchResult);
    });
  },

  findAll: function(req, res) {
    return searchController.findAll(req, res, MappingV1Service.convertToOldSearchResult);
  },


};
