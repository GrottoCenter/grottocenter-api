/**
 * BbsGeoController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

'use strict';
module.exports = {
    find: function(req, res, next, converter) {
        TBbsGeo.findOne({
            id: req.params.id
        }).exec(function(err, found) {
            let params = {};
            params.controllerMethod = 'BbsGeoController.find';
            params.searchedItem = 'BBSGeo of id ' + req.params.id;
            return ControllerService.treatAndConvert(req, err, found, params, res, converter);
        });
    },

};

