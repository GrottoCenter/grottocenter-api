/**
 * BbsController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

'use strict';
module.exports = {
    find: function (req, res, next, converter) {
        TBbs.findOne({
            id: req.params.id
        }).populate('country').populate('chapter').exec(function (err, found) {
            let params = {};
            params.controllerMethod = 'BbsController.find';
            params.searchedItem = 'BBS of id ' + req.params.id;
            return ControllerService.treatAndConvert(req, err, found, params, res, converter);
        });
    },
};

