const ControllerService = require('../../../services/ControllerService');
const NameService = require('../../../services/NameService');
const { toMassifListItem } = require('../../../services/mapping/converters');
const readDeletedListParams = require('../../../utils/readDeletedListParams');

// Summary columns only: the polygon is left to GET /massifs/:id.
const SELECT = [
  'id',
  'isSensitive',
  'isDeleted',
  'redirectTo',
  'dateInscription',
  'dateReviewed',
];

module.exports = async (req, res) => {
  // By default list the active massifs only; the deleted ones (including
  // those merged into another massif) are for administrators and moderators.
  const params = readDeletedListParams(req, 'massifs');
  if (params.badRequest) return res.badRequest(params.badRequest);
  if (params.forbidden) return res.forbidden(params.forbidden);
  const { isDeleted, skip, limit } = params;

  const whereClause = { isDeleted };
  const total = await TMassif.count(whereClause);
  const massifs = await TMassif.find(whereClause)
    .select(SELECT)
    .sort('id ASC')
    .skip(skip)
    .limit(limit);
  await NameService.setNames(massifs, 'massif');

  return ControllerService.treatPage(req, res, {
    key: 'massifs',
    rows: massifs,
    total,
    skip,
    limit,
    converter: toMassifListItem,
    controllerMethod: 'MassifController.findAll',
    searchedItem: 'All massifs',
  });
};
