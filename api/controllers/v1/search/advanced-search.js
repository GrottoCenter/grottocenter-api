const ControllerService = require('../../../services/ControllerService');
const SearchService = require('../../../services/SearchService');
const {
  handleTypesenseError,
} = require('../../../services/TypesenseErrorService');
const { toSearchResult } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  let matchAllFields = req.param('matchAllFields') ?? true;
  if (!matchAllFields || matchAllFields === 'false') matchAllFields = false;

  let results;
  try {
    results = await SearchService.collectionSearch({
      query: req.param('query'),
      entity: req.param('entity') ?? '',
      sort: req.param('sort'),
      filter: req.param('filter') ?? {},
      isLogicalCompareAnd: !!matchAllFields,
      page: req.param('page') ?? 1,
      size: req.param('size') ?? 10,
    });
  } catch (error) {
    if (handleTypesenseError(res, error)) return undefined;
    throw error;
  }

  return ControllerService.treatAndConvert(
    req,
    undefined,
    results,
    {},
    res,
    toSearchResult
  );
};
