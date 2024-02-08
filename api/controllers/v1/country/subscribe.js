const ErrorService = require('../../../services/ErrorService');
const RightService = require('../../../services/RightService');

const { checkIfExists } = sails.helpers;

module.exports = async (req, res) => {
  // Check right
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.LEADER
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to subscribe to a country.');
  }

  // Check if country exists
  const countryId = req.param('id');
  if (
    !(await checkIfExists.with({
      attributeName: 'id',
      attributeValue: countryId,
      sailsModel: TCountry,
    }))
  ) {
    return res.notFound({
      error: `Could not find country with id ${countryId}.`,
    });
  }

  try {
    await TCaver.addToCollection(req.token.id, 'subscribedToCountries', [
      countryId,
    ]);
    return res.ok();
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
