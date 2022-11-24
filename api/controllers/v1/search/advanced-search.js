const ControllerService = require('../../../services/ControllerService');
const MappingService = require('../../../services/mapping/MappingService');
const ElasticsearchService = require('../../../services/ElasticsearchService');
const {
  INDEX_NAMES,
} = require('../../../../config/constants/elasticsearch-indexes');

/**
 * Perform an advanced search using multiple URL parameters :
 * - resourceType: string, entity type to search for (@see INDEX_NAMES) (MANDATORY)
 * - complete: bool, determine if the results must be returned in their
 *      entirely or just their id and name (default = false) (FACULTATIVE)
 * - matchAllFields: bool, determine if the results need to match all the fields (logic AND)
 *      or at least one of them (logic OR) (default = true) (FACULTATIVE)
 */
module.exports = (req, res) => {
  // Store every params in the url and check if there is the type parameter
  const paramsURL = req.query;

  if (!INDEX_NAMES.includes(paramsURL.resourceType)) {
    return res.badRequest();
  }

  // By default, the query asked will send every information.
  let complete = true;
  if (paramsURL.complete && paramsURL.complete === 'false') {
    complete = false;
  }

  // Cast matchAllFields to bool
  if (paramsURL.matchAllFields && paramsURL.matchAllFields === 'false') {
    paramsURL.matchAllFields = false;
  } else if (paramsURL.matchAllFields && paramsURL.matchAllFields === 'true') {
    paramsURL.matchAllFields = true;
  }

  const params = {};

  return ElasticsearchService.advancedSearchQuery(paramsURL)
    .then((results) => {
      if (complete) {
        return ControllerService.treatAndConvert(
          req,
          undefined,
          results,
          params,
          res,
          MappingService.convertToCompleteSearchResult
        );
      }
      return ControllerService.treatAndConvert(
        req,
        undefined,
        results,
        params,
        res,
        MappingService.convertEsToSearchResult
      );
    })
    .catch((err) =>
      ControllerService.treatAndConvert(
        req,
        err,
        undefined,
        params,
        res,
        MappingService.convertEsToSearchResult
      )
    );
};
