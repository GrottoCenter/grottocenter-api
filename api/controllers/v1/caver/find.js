const CaverService = require('../../../services/CaverService');
const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');
const { toCaver } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const caverId = req.params.id;
  const params = { searchedItem: `Caver of id ${caverId}` };

  const caverFound = await CaverService.getCaver(caverId);
  if (!caverFound)
    return res.notFound({ error: `${params.searchedItem} not found` });

  caverFound.documents = await DocumentService.getDocuments(
    caverFound.documents.map((d) => d.id)
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    caverFound,
    params,
    res,
    toCaver
  );
};
