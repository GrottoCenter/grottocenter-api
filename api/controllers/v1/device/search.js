const ControllerService = require('../../../services/ControllerService');
const SearchService = require('../../../services/SearchService');
const {
  handleTypesenseError,
} = require('../../../services/TypesenseErrorService');
const { toSearchResult } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  let results;
  try {
    results = await SearchService.collectionSearch({
      query: req.param('query'),
      entity: 'devices',
      sort: req.param('sort'),
      filter: req.param('filter') ?? {},
      page: req.param('page') ?? 1,
      size: req.param('size') ?? 10,
    });
  } catch (error) {
    if (handleTypesenseError(res, error)) return res;
    sails.log.error('DeviceSearch: unexpected error', error);
    throw error;
  }

  return ControllerService.treatAndConvert(
    req,
    null,
    results,
    {},
    res,
    toSearchResult
  );
};
