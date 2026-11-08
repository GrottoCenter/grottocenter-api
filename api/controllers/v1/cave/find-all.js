const ControllerService = require('../../../services/ControllerService');
const NameService = require('../../../services/NameService');
const { toCaveListItem } = require('../../../services/mapping/converters');
const readDeletedListParams = require('../../../utils/readDeletedListParams');

const SELECT = [
  'id',
  'depth',
  'caveLength',
  'isDiving',
  'temperature',
  'isDeleted',
  'redirectTo',
  'dateInscription',
  'dateReviewed',
];

module.exports = async (req, res) => {
  // Every cave, single-entrance ones and networks alike. By default the
  // active ones only; the deleted ones (including a cave emptied by moving
  // its last entrance away, redirected to the destination cave) are for
  // administrators and moderators. A cave is listed whatever the number of
  // entrances still attached to it.
  const params = readDeletedListParams(req, 'caves');
  if (params.badRequest) return res.badRequest(params.badRequest);
  if (params.forbidden) return res.forbidden(params.forbidden);
  const { isDeleted, skip, limit } = params;

  const whereClause = { isDeleted };
  const total = await TCave.count(whereClause);
  const caves = await TCave.find(whereClause)
    .select(SELECT)
    .populate('entrances', { select: ['id'] })
    .sort('id ASC')
    .skip(skip)
    .limit(limit);
  await NameService.setNames(caves, 'cave');

  return ControllerService.treatPage(req, res, {
    key: 'caves',
    rows: caves,
    total,
    skip,
    limit,
    converter: toCaveListItem,
    controllerMethod: 'CaveController.findAll',
    searchedItem: 'All caves',
  });
};
