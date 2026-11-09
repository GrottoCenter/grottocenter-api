const ControllerService = require('../../../services/ControllerService');
const NameService = require('../../../services/NameService');
const { toEntranceListItem } = require('../../../services/mapping/converters');
const readDeletedListParams = require('../../../utils/readDeletedListParams');

// Summary columns only: the list is not a substitute for GET /entrances/:id.
const SELECT = [
  'id',
  'cave',
  'country',
  'region',
  'county',
  'city',
  'latitude',
  'longitude',
  'isSensitive',
  'isDeleted',
  'redirectTo',
  'dateInscription',
  'dateReviewed',
];

module.exports = async (req, res) => {
  // By default list the active entrances only; the deleted ones (including
  // those merged into another entrance) are for administrators and moderators.
  const params = readDeletedListParams(req, 'entrances');
  if (params.badRequest) return res.badRequest(params.badRequest);
  if (params.forbidden) return res.forbidden(params.forbidden);
  const { isDeleted, skip, limit } = params;

  const whereClause = { isDeleted };
  const total = await TEntrance.count(whereClause);
  const entrances = await TEntrance.find(whereClause)
    .select(SELECT)
    .sort('id ASC')
    .skip(skip)
    .limit(limit);
  await NameService.setNames(entrances, 'entrance');

  // The coordinates of a sensitive entrance stay hidden from anyone but an
  // administrator (toSimpleEntrance), whatever the deletion filter.
  return ControllerService.treatPage(req, res, {
    key: 'entrances',
    rows: entrances,
    total,
    skip,
    limit,
    converter: toEntranceListItem,
    controllerMethod: 'EntranceController.findAll',
    searchedItem: 'All entrances',
  });
};
