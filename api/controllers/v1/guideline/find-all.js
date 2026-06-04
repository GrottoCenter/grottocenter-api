const ControllerService = require('../../../services/ControllerService');
const { toSimpleGuideline } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  try {
    const skip = Math.max(parseInt(req.param('skip', 0), 10) || 0, 0);
    const limit = Math.max(
      Math.min(parseInt(req.param('limit', 50), 10) || 50, 100),
      1
    );

    const totalNb = await TGuideline.count({ isDeleted: false });
    const guidelines = await TGuideline.find({ isDeleted: false })
      .skip(skip)
      .limit(limit)
      .populate('author')
      .populate('reviewer')
      .populate('countries')
      .populate('regions')
      .populate('massifs');

    return ControllerService.treatAndConvert(
      req,
      null,
      guidelines,
      {
        controllerMethod: 'GuidelineController.findAll',
        limit,
        searchedItem: 'guidelines',
        skip,
        total: totalNb,
        url: req.originalUrl,
      },
      res,
      (data) => data.map(toSimpleGuideline)
    );
  } catch (err) {
    sails.log.error(err);
    return res.serverError(
      'There was a problem while retrieving the guidelines.'
    );
  }
};
