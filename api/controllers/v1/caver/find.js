const NameService = require('../../../services/NameService');
const DescriptionService = require('../../../services/DescriptionService');
const CaverService = require('../../../services/CaverService');
const ControllerService = require('../../../services/ControllerService');
const { toCaver } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const caverId = req.params.id;
  const params = { searchedItem: `Caver of id ${caverId}` };

  const caverFound = await CaverService.getCaver(caverId, req);
  if (!caverFound)
    return res.notFound({ error: `${params.searchedItem} not found` });

  const asyncArr = [
    NameService.setNames(caverFound.exploredEntrances, 'entrance'),
    NameService.setNames(caverFound.grottos, 'grotto'),
    NameService.setNames(caverFound.subscribedToMassifs, 'massif'),
  ];
  if (caverFound.documents) {
    asyncArr.push(
      ...caverFound.documents.map((d) =>
        DescriptionService.setDocumentDescriptions(d, false)
      )
    );
  }
  await Promise.all(asyncArr);

  return ControllerService.treatAndConvert(
    req,
    null,
    caverFound,
    params,
    res,
    toCaver
  );
};
