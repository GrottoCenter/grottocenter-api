const ControllerService = require('../../../services/ControllerService');
const FileService = require('../../../services/FileService');
const exportUtils = require('../../../../script/dbExport/utils');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const SIX_HOUR_MS = 1000 * 60 * 60 * 6;

  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.LEADER
  );
  if (!hasRight) return res.forbidden();

  const url = FileService.dbExport.getUrl(
    exportUtils.EXPORT_FILE_NAME,
    SIX_HOUR_MS
  );
  const metadata = await FileService.dbExport.getMetadata();

  return ControllerService.treat(
    req,
    null,
    { url, ...metadata },
    { controllerMethod: 'CaverController.getDbExport' },
    res
  );
};
