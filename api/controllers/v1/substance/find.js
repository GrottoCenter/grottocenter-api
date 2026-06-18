const ControllerService = require('../../../services/ControllerService');
const SubstanceService = require('../../../services/SubstanceService');

module.exports = async (req, res) => {
  const { search } = req.query;

  // Validate minimum search length when provided
  if (search && search.length < 2) {
    return res.badRequest({
      message: 'Search must be at least 2 characters',
    });
  }

  // Determine authentication status from req.token presence
  const isAuthenticated = !!req.token;

  let results;
  try {
    results = await SubstanceService.search(search || null, isAuthenticated);
  } catch (err) {
    sails.log.error(err);
    return res.serverError(
      'An internal error occurred while searching substances.'
    );
  }

  return ControllerService.treat(
    req,
    null,
    results,
    { controllerMethod: 'SubstanceController.find' },
    res
  );
};
