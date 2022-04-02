const ControllerService = require('../../../services/ControllerService');

module.exports = (req, res) => {
  TType.find({
    ...(req.param('isAvailable', undefined) !== undefined && {
      isAvailable: req.param('isAvailable'),
    }),
  }).exec((err, found) => {
    const params = {
      controllerMethod: 'DocumentTypeController.findAll',
      searchedItem: 'All document types',
    };
    const formattedFound = {
      documentTypes: found,
    };
    return ControllerService.treat(req, err, formattedFound, params, res);
  });
};
