/**
 * BbsGeoController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  find: (req, res, next, converter) => {
    TBbsGeo.findOne({
      id: req.params.id,
    }).exec((err, found) => {
      const params = {};
      params.controllerMethod = 'BbsGeoController.find';
      params.searchedItem = `BBSGeo of id ${req.params.id}`;
      return ControllerService.treatAndConvert(req, err, found, params, res, converter);
    });
  },
};
