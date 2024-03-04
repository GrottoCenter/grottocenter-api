const ControllerService = require('../../../services/ControllerService');
const { toOrganization } = require('../../../services/mapping/converters');
const { toListFromController } = require('../../../services/mapping/utils');

module.exports = (req, res) => {
  let skip = 0;
  if (req.param('skip')) {
    skip = req.param('skip');
  }
  let limit = 30;
  if (req.param('limit')) {
    limit = req.param('limit');
  }
  TGrotto.find({ select: ['id', 'pictureFileName', 'customMessage'] })
    .skip(skip)
    .limit(limit)
    .sort('id ASC')
    .where({
      customMessage: {
        '!=': null,
      },
      pictureFileName: {
        '!=': '',
      },
      isOfficialPartner: '1',
    })
    .sort('id ASC')
    .populate('names')
    .exec((err, found) => {
      const params = {};
      params.controllerMethod = 'PartnerController.findForCarousel';
      params.notFoundMessage = 'No partners found.';
      return ControllerService.treatAndConvert(
        req,
        err,
        found,
        params,
        res,
        (data, meta) =>
          toListFromController('organization', data, toOrganization, { meta })
      );
    });
};
