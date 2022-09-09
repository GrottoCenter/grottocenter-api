const ErrorService = require('../../../services/ErrorService');
const RightService = require('../../../services/RightService');

const { checkIfExists } = sails.helpers;
const { checkRight } = sails.helpers;

module.exports = async (req, res) => {
  // Check right
  const hasRight = await checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.COUNTRY,
      rightAction: RightService.RightActions.SUBSCRIBE,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to subscribe to a country.'
      )
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
