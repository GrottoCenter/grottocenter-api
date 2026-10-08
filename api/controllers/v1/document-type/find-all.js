const ControllerService = require('../../../services/ControllerService');
const readBoolParam = require('../../../utils/readBoolParam');

module.exports = (req, res) => {
  const { value: isAvailable, error: isAvailableError } = readBoolParam(
    req,
    'isAvailable'
  );
  if (isAvailableError) return res.badRequest(isAvailableError);

  return TType.find(isAvailable === undefined ? {} : { isAvailable }).exec(
    (err, found) => {
      const params = {
        controllerMethod: 'DocumentTypeController.findAll',
        searchedItem: 'All document types',
      };
      const formattedFound = {
        documentTypes: found,
      };
      return ControllerService.treat(req, err, formattedFound, params, res);
    }
  );
};
