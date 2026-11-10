const ControllerService = require('../../../services/ControllerService');
const SearchService = require('../../../services/SearchService');
const {
  handleTypesenseError,
} = require('../../../services/TypesenseErrorService');
const { toSearchResult } = require('../../../services/mapping/converters');
const readBoolParam = require('../../../utils/readBoolParam');

module.exports = async (req, res) => {
  const query = req.param('query');
  if (!query) {
    res.badRequest('You must provide a query');
    return;
  }

  const {
    value: includePendingDocuments,
    error: includePendingDocumentsError,
  } = readBoolParam(req, 'includePendingDocuments', false);
  if (includePendingDocumentsError) {
    res.badRequest(includePendingDocumentsError);
    return;
  }

  // Search on multiple entities but with no pagging and sort
  let results;
  try {
    results = await SearchService.multiCollectionsSearch({
      query,
      entities: req.param('entities'),
      filter: req.param('filter') ?? {},
      includePendingDocuments,
    });
  } catch (error) {
    if (handleTypesenseError(res, error)) return;
    throw error;
  }

  ControllerService.treatAndConvert(
    req,
    undefined,
    results,
    {},
    res,
    toSearchResult
  );
};
