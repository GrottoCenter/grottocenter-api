const ControllerService = require('../../../services/ControllerService');
const {
  toOrganizationListItem,
} = require('../../../services/mapping/converters');
const readDeletedListParams = require('../../../utils/readDeletedListParams');

module.exports = async (req, res) => {
  // By default list the active organizations only; the deleted ones
  // (including those merged into another organization) are for
  // administrators and moderators.
  const params = readDeletedListParams(req, 'organizations');
  if (params.badRequest) return res.badRequest(params.badRequest);
  if (params.forbidden) return res.forbidden(params.forbidden);
  const { isDeleted, skip, limit } = params;

  const whereClause = { isDeleted };
  const total = await TGrotto.count(whereClause);
  const organizations = await TGrotto.find(whereClause)
    .populate('names')
    .sort('id ASC')
    .skip(skip)
    .limit(limit);

  return ControllerService.treatPage(req, res, {
    key: 'organizations',
    rows: organizations,
    total,
    skip,
    limit,
    converter: toOrganizationListItem,
    controllerMethod: 'GrottoController.findAll',
    searchedItem: 'All organizations',
  });
};
