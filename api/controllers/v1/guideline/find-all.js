const ControllerService = require('../../../services/ControllerService');
const { toSimpleGuideline } = require('../../../services/mapping/converters');
const readDeletedListParams = require('../../../utils/readDeletedListParams');

module.exports = async (req, res) => {
  // By default list the active guidelines only; the deleted ones are for
  // administrators and moderators.
  const params = readDeletedListParams(req, 'guidelines');
  if (params.badRequest) return res.badRequest(params.badRequest);
  if (params.forbidden) return res.forbidden(params.forbidden);
  const { isDeleted, skip, limit } = params;

  try {
    const whereClause = { isDeleted };
    const total = await TGuideline.count(whereClause);
    const guidelines = await TGuideline.find(whereClause)
      .sort('id ASC')
      .skip(skip)
      .limit(limit)
      .populate('author')
      .populate('reviewer')
      .populate('countries')
      .populate('regions')
      .populate('massifs');

    return ControllerService.treatPage(req, res, {
      key: 'guidelines',
      rows: guidelines,
      total,
      skip,
      limit,
      converter: toSimpleGuideline,
      controllerMethod: 'GuidelineController.findAll',
      searchedItem: 'guidelines',
    });
  } catch (err) {
    sails.log.error(err);
    return res.serverError(
      'There was a problem while retrieving the guidelines.'
    );
  }
};
