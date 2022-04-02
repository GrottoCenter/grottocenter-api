const CaverService = require('../../../services/CaverService');
const ControllerService = require('../../../services/ControllerService');
const MappingV1Service = require('../../../services/MappingV1Service');

module.exports = async (req, res) => {
  const caverId = req.param('id');

  const params = {};
  params.searchedItem = `Caver of id ${caverId}`;

  const caverFound = await CaverService.getCaver(caverId, req);

  if (!caverFound) {
    const notFoundMessage = `${params.searchedItem} not found`;
    sails.log.debug(notFoundMessage);
    res.status(404);
    return res.json({ error: notFoundMessage });
  }

  return ControllerService.treatAndConvert(
    req,
    null,
    caverFound,
    params,
    res,
    MappingV1Service.convertToCaverModel
  );
};
