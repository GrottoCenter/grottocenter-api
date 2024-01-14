const ControllerService = require('../../../services/ControllerService');

module.exports = (req, res) => {
  // TODO Remove as the front now use ISO3166 region ?
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
