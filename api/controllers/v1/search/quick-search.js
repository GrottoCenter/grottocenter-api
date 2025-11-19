const ControllerService = require('../../../services/ControllerService');
const SearchService = require('../../../services/SearchService');
const { toSearchResult } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const query = req.param('query');
  if (!query) {
    res.badRequest('You must provide a query');
    return;
  }

  // Search on multiple entities but with no pagging and sort
  const results = await SearchService.multiCollectionsSearch({
    query,
    entities: req.param('entities'),
    filter: req.param('filter') ?? {},
  });

  ControllerService.treatAndConvert(
    req,
    undefined,
    results,
    {},
    res,
    toSearchResult
  );
};
