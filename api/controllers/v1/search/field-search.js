const ControllerService = require('../../../services/ControllerService');
const SearchService = require('../../../services/SearchService');

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

  let matchAllFields = req.param('matchAllFields') ?? true;
  if (!matchAllFields || matchAllFields === 'false') matchAllFields = false;

  const r = await SearchService.fieldSearch({
    entity,
    field,
    query: req.param('query'),
    size: req.param('size') ?? 10,
    filter: req.param('filter') ?? {},
    isLogicalCompareAnd: !!matchAllFields,
  });

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
