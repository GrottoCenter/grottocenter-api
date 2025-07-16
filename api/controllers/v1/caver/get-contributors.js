const ControllerService = require('../../../services/ControllerService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasAdmin = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );

  const hasModerator = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );

  if (!hasAdmin && !hasModerator) {
    return res.forbidden('You are not authorized to access this endpoint');
  }

  const cavers = await sails.models.vcaverroles.find({ isContributor: true });

  if (!cavers) {
    return res.notFound({ message: 'No contributors found.' });
  }

  return ControllerService.treat(
    req,
    null,
    cavers,
    { controllerMethod: 'CaverController.getContributors' },
    res
  );
};
