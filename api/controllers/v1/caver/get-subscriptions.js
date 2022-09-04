const ErrorService = require('../../../services/ErrorService');
const NameService = require('../../../services/NameService');

module.exports = async (req, res) => {
  // Get subscriptions
  try {
    const caverId = req.param('caverId');
    const caver = await TCaver.findOne(caverId)
      .populate('subscribedToCountries')
      .populate('subscribedToMassifs');
    if (!caver) {
      return res.notFound({
        message: `Caver with id ${caverId} not found.`,
      });
    }

    await NameService.setNames(caver.subscribedToMassifs, 'massif');

    return res.ok({
      subscriptions: {
        massifs: caver.subscribedToMassifs,
        countries: caver.subscribedToCountries,
      },
    });
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
