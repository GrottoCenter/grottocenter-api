const ControllerService = require('../../../services/ControllerService');
const SearchService = require('../../../services/SearchService');
const {
  handleTypesenseError,
} = require('../../../services/TypesenseErrorService');
const readBoolParam = require('../../../utils/readBoolParam');
const normalizeBoolFilter = require('../../../utils/normalizeBoolFilter');

module.exports = async (req, res) => {
  const field = req.param('field');
  if (!field) {
    res.badRequest('You must provide a "field"');
    return;
  }
  const entity = req.param('entity');
  if (!entity) {
    res.badRequest('You must provide a "entity"');
    return;
  }

  const { value: matchAllFields, error: matchAllFieldsError } = readBoolParam(
    req,
    'matchAllFields',
    true
  );
  if (matchAllFieldsError) {
    res.badRequest(matchAllFieldsError);
    return;
  }

  const { filter, error: filterError } = normalizeBoolFilter(
    req.param('filter') ?? {},
    'hasFiles'
  );
  if (filterError) {
    res.badRequest(
      readBoolParam.formatInvalidBoolError(
        req,
        filterError.field,
        filterError.value
      )
    );
    return;
  }

  let r;
  try {
    r = await SearchService.fieldSearch({
      entity,
      field,
      query: req.param('query'),
      size: req.param('size') ?? 10,
      filter,
      isLogicalCompareAnd: matchAllFields,
    });
  } catch (error) {
    if (handleTypesenseError(res, error)) return;
    throw error;
  }

  if (!r) {
    const validEntities = SearchService.allEntitiesKeys.join(', ');
    res.badRequest(
      `Unknown entity "${entity}". Valid entities are: ${validEntities}`
    );
    return;
  }

  const out = {
    totalDistinct: r.found,
    totalDocuments: r.found_docs,
    hits: r.grouped_hits
      .map((e) => [e.group_key[0] ?? '', e.found])
      .filter((e) => e[0]),
    page: r.page,
  };
  ControllerService.treat(req, null, out, {}, res);
};
