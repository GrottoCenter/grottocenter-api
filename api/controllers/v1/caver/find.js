const NameService = require('../../../services/NameService');
const DescriptionService = require('../../../services/DescriptionService');
const CaverService = require('../../../services/CaverService');
const ControllerService = require('../../../services/ControllerService');
const { toCaver } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const caverId = req.param('id');

  const params = {};
  params.searchedItem = `Caver of id ${caverId}`;

  const caverFound = await CaverService.getCaver(caverId, req);

  if (!caverFound) {
    return res.notFound({ error: `${params.searchedItem} not found` });
  }

  // complete names
  await NameService.setNames(caverFound.exploredEntrances, 'entrance');
  await NameService.setNames(caverFound.grottos, 'grotto');

  // complete descriptions
  if (caverFound.documents && caverFound.documents.length > 0) {
    const promisesArray = [];
    for (let i = 0; i < caverFound.documents.length; i += 1) {
      promisesArray.push(
        DescriptionService.setDocumentDescriptions(
          caverFound.documents[i],
          false
        )
      );
    }
    await Promise.all(promisesArray);
  }

  return ControllerService.treatAndConvert(
    req,
    null,
    caverFound,
    params,
    res,
    toCaver
  );
};
