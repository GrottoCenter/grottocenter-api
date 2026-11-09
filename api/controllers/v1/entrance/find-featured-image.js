const ControllerService = require('../../../services/ControllerService');
const EntranceFeaturedFileService = require('../../../services/EntranceFeaturedFileService');
const RightService = require('../../../services/RightService');
const {
  toEntranceFeaturedImage,
} = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const entranceId = Number(req.params.entranceId);
  const params = { searchedItem: `Entrance of id ${entranceId}` };

  const entrance = await EntranceFeaturedFileService.getFeaturedImage(
    entranceId,
    { canViewDeleted: RightService.canViewDeleted(req.token?.groups) }
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    entrance,
    params,
    res,
    toEntranceFeaturedImage
  );
};
