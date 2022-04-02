const ControllerService = require('../../../services/ControllerService');

module.exports = (req, res) => {
  TRegion.find().exec((err, found) => {
    const params = {
      controllerMethod: 'TRegionController.findAll',
      searchedItem: 'All regions',
    };
    const formattedFound = {
      regions: found,
    };
    return ControllerService.treat(req, err, formattedFound, params, res);
  });
};
