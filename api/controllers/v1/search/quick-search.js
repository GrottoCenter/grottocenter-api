const ControllerService = require('../../../services/ControllerService');
const ElasticsearchService = require('../../../services/ElasticsearchService');
const { toSearchResult } = require('../../../services/mapping/converters');
const {
  toCompleteSearchResult,
} = require('../../../services/mapping/converters');
/**
 * Perform a quick search using multiple URL parameters:
 * - query: string to search for (MANDATORY)
 * - complete: boolean, specify if we must send all the information or just a summary
 * - resourceType:  string, entity type to search for (@see INDEX_NAMES) (FACULTATIVE).
 * - resourceTypes:  Array of string, entity types to search for (@see INDEX_NAMES) (FACULTATIVE).
 * By default, search on all entities except document-collections.
 * */
module.exports = async (req, res) => {
  if (!req.param('query')) {
    res.badRequest();
    return;
  }

  // By default, the query asked will send every information.
  // We can limit these information just by adding a "complete" parameter to false in the query.
  let complete = true;
  if (req.param('complete') === 'false' || req.param('complete') === false) {
    complete = false;
  }

  const params = {
    searchedItem: `Search entity with the following query '${req.param(
      'query'
    )}'`,
  };

  // Extract search parameters
  const searchParams = {
    from: req.param('from'),
    size: req.param('size'),
    query: req.param('query'),
    resourceType: req.param('resourceType'),
    resourceTypes: req.param('resourceTypes'),
  };

  const results = await ElasticsearchService.searchQuery(searchParams);

  ControllerService.treatAndConvert(
    req,
    undefined,
    results,
    params,
    res,
    complete ? toCompleteSearchResult : toSearchResult
  );
};
