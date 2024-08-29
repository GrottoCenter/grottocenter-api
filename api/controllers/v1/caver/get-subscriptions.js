const NameService = require('../../../services/NameService');
const { toSimpleMassif } = require('../../../services/mapping/converters');
const { toList } = require('../../../services/mapping/utils');

function toSimpleCountry(source) {
  return {
    id: source.id,
    name: source.nativeName,
  };
}

module.exports = async (req, res) => {
  const caverId = req.param('caverId');
  const caver = await TCaver.findOne(caverId)
    .populate('subscribedToCountries')
    .populate('subscribedToMassifs');

  if (!caver) {
    return res.notFound({ message: `Caver with id ${caverId} not found.` });
  }

  await NameService.setNames(caver.subscribedToMassifs, 'massif');

  return res.ok({
    subscriptions: {
      massifs: toList('subscribedToMassifs', caver, toSimpleMassif),
      countries: toList('subscribedToCountries', caver, toSimpleCountry),
    },
  });
};
