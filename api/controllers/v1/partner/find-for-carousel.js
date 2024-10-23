const ControllerService = require('../../../services/ControllerService');
const { toOrganization } = require('../../../services/mapping/converters');
const { toListFromController } = require('../../../services/mapping/utils');

module.exports = async (req, res) => {
  let skip = 0;
  let limit = 50;
  if (req.param('skip')) {
    skip = req.param('skip');
  }
  if (req.param('limit')) {
    limit = req.param('limit');
  }
  const found = await TGrotto.find({
    select: ['id', 'pictureFileName', 'customMessage'],
  })
    .where({
      customMessage: { '!=': null },
      pictureFileName: { '!=': '' },
      isOfficialPartner: '1',
    })
    .skip(skip)
    .limit(limit)
    .sort('id ASC')
    .populate('names');

  return ControllerService.treatAndConvert(
    req,
    null,
    found,
    {
      controllerMethod: 'PartnerController.findForCarousel',
      notFoundMessage: 'No partners found.',
    },
    res,
    (data, meta) =>
      toListFromController('organization', data, toOrganization, { meta })
  );
};
