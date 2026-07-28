const CaverService = require('../../../services/CaverService');
const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');
const RightService = require('../../../services/RightService');
const { toCaver } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const caverId = Number(req.params.id);

  const params = { searchedItem: `Caver of id ${caverId}` };

  const caverFound = await CaverService.getCaver(caverId);
  if (!caverFound)
    return res.notFound({ error: `${params.searchedItem} not found` });

  caverFound.documents = await DocumentService.getDocumentsForCitation(
    caverFound.documents.map((d) => d.id)
  );

  const isAdmin =
    req.token &&
    RightService.hasGroup(req.token.groups, RightService.G.ADMINISTRATOR);

  return ControllerService.treatAndConvert(
    req,
    null,
    caverFound,
    params,
    res,
    (source) => toCaver(source, { isAdmin })
  );
};
