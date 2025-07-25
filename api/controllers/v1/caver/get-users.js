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

  const page = parseInt(req.params.page, 10);
  if (Number.isNaN(page) || page <= 0) {
    return res.badRequest({
      message: 'Invalid page parameter. Page must be a positive integer.',
    });
  }

  const limit = 100;
  const skip = (page - 1) * limit;
  const total = await sails.models.vcaverroles.count({ isUser: true });
  const totalPages = Math.ceil(total / limit);
  if (page > totalPages) {
    return res.notFound({ message: 'Page not found' });
  }

  const caversPage = await sails.models.vcaverroles
    .find({ isUser: true })
    .limit(limit)
    .skip(skip)
    .sort('id ASC');

  if (!caversPage.length) {
    return res.notFound({ message: 'No users found.' });
  }

  const cavers = {
    data: caversPage,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };

  return ControllerService.treat(
    req,
    null,
    cavers,
    { controllerMethod: 'CaverController.getUsers' },
    res
  );
};
