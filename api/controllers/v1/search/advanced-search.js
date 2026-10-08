const ControllerService = require('../../../services/ControllerService');
const SearchService = require('../../../services/SearchService');
const {
  handleTypesenseError,
} = require('../../../services/TypesenseErrorService');
const { toSearchResult } = require('../../../services/mapping/converters');
const normalizeDataQualityFilter = require('../../../utils/normalizeDataQualityFilter');
const readBoolParam = require('../../../utils/readBoolParam');

// Sort fields that are only valid for specific entities
const ENTITY_SPECIFIC_SORT_FIELDS = {
  dataQuality: ['entrances'],
  authorsSort: ['documents'],
};

module.exports = async (req, res) => {
  const { value: matchAllFields, error: matchAllFieldsError } = readBoolParam(
    req,
    'matchAllFields',
    true
  );
  if (matchAllFieldsError) return res.badRequest(matchAllFieldsError);

  const entity = req.param('entity') ?? '';
  const rawSort = req.param('sort');
  const sort = typeof rawSort === 'string' ? rawSort : undefined;

  // Validate entity-specific sort fields
  if (sort) {
    const sortFields = sort.split(',').map((s) => s.trim().split(':')[0]);
    for (const sortField of sortFields) {
      const allowedEntities = ENTITY_SPECIFIC_SORT_FIELDS[sortField];
      if (allowedEntities && !allowedEntities.includes(entity)) {
        return res.badRequest(
          `The ${sortField} sort field is only valid for entity=${allowedEntities.join(', ')}.`
        );
      }
    }
  }

  const filter = normalizeDataQualityFilter(req.param('filter') ?? {});

  let results;
  try {
    results = await SearchService.collectionSearch({
      query: req.param('query'),
      entity,
      sort,
      filter,
      isLogicalCompareAnd: matchAllFields,
      page: req.param('page') ?? 1,
      size: req.param('size') ?? 10,
    });
  } catch (error) {
    if (handleTypesenseError(res, error)) return undefined;
    throw error;
  }

  if (!results) {
    const validEntities = SearchService.allEntitiesKeys.join(', ');
    return res.badRequest(
      `Unknown entity "${entity}". Valid entities are: ${validEntities}`
    );
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
