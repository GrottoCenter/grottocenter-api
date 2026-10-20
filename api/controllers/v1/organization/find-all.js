const ControllerService = require('../../../services/ControllerService');
const RightService = require('../../../services/RightService');
const { toListFromController } = require('../../../services/mapping/utils');
const {
  toSimpleOrganization,
} = require('../../../services/mapping/converters');
const readBoolParam = require('../../../utils/readBoolParam');

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const readIntParam = (req, name, fallback) => {
  const value = parseInt(req.param(name), 10);
  return Number.isNaN(value) ? fallback : value;
};

module.exports = async (req, res) => {
  // By default list the active organizations only; the deleted ones
  // (including those merged into another organization) are for moderators.
  const { value: isDeleted, error: isDeletedError } = readBoolParam(
    req,
    'isDeleted',
    false
  );
  if (isDeletedError) return res.badRequest(isDeletedError);

  if (isDeleted) {
    const hasRight = RightService.hasGroup(
      req.token?.groups,
      RightService.G.MODERATOR
    );
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to list deleted organizations.'
      );
    }
  }

  const skip = Math.max(readIntParam(req, 'skip', 0), 0);
  const limit = Math.max(
    Math.min(readIntParam(req, 'limit', DEFAULT_LIMIT), MAX_LIMIT),
    1
  );

  const whereClause = { isDeleted };
  const total = await TGrotto.count(whereClause);
  const organizations = await TGrotto.find(whereClause)
    .populate('names')
    .sort('id ASC')
    .skip(skip)
    .limit(limit);

  if (organizations.length === 0) {
    return res.ok({ organizations: [] });
  }

  const params = {
    controllerMethod: 'GrottoController.findAll',
    searchedItem: 'All organizations',
    limit,
    skip,
    total,
    url: req.originalUrl,
  };
  return ControllerService.treatAndConvert(
    req,
    null,
    organizations,
    params,
    res,
    (data, meta) =>
      // The deletion filter is applied by the query: keep every row as is.
      toListFromController('organizations', data, toSimpleOrganization, {
        filterDeleted: false,
        meta,
      })
  );
};
