/**
 * BbsController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

'use strict';
module.exports = {
    find: function(req, res, next, converter) {
        TBbs.findOne({
            id: req.params.ref_
        }).populate('country').populate('chapter').exec(function(err, found) {
            let params = {};
            params.controllerMethod = 'BbsController.find';
            params.notFoundMessage = 'BBS of ref_ ' + req.params.ref_ + ' not found.';
            return ControllerService.treatAndConvert(req, err, found, params, res, converter);
        });
    },

};

