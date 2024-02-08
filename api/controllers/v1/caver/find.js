const NameService = require('../../../services/NameService');
const DocumentService = require('../../../services/DocumentService');
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
    (async () => {
      caverFound.documents = await DocumentService.getDocuments(
        caverFound.documents.map((d) => d.id)
      );
    })(),
  ];

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
