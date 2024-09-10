const ControllerService = require('../../../services/ControllerService');
const RightService = require('../../../services/RightService');
const { toSimpleCave } = require('../../../services/mapping/converters');
const { toListFromController } = require('../../../services/mapping/utils');
const NameService = require('../../../services/NameService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token?.groups,
    RightService.G.MODERATOR
  );

  const parameters = {};
  if (!hasRight) parameters.isDeleted = false;

  const found = await TCave.find(parameters)
    .populate('entrances')
    .populate('names')
    .sort('id ASC')
    .limit(10);

  await NameService.setNames(found, 'cave');

  return ControllerService.treatAndConvert(
    req,
    null,
    found,
    {
      controllerMethod: 'CaveController.findAll',
      searchedItem: 'all caves',
      notFoundMessage: 'No caves found.',
    },
    res,
    (data) => toListFromController('caves', data, toSimpleCave)
  );
};
