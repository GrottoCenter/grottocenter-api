/**
 * BbsController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
    create: function(req, res) {
        return res.badRequest('BbsController.create not yet implemented!');
    },

    update: function(req, res) {
        return res.badRequest('BbsController.update not yet implemented!');
    },

    delete: function(req, res) {
        return res.badRequest('BbsController.delete not yet implemented!');
    },

    find: function(req, res) {
        TBbs.findOne({
            id: req.params.ref_
        }).populate('country').populate('chapter').exec(function(err, found) {
            let params = {};
            params.controllerMethod = 'BbsController.find';
            params.notFoundMessage = 'BBS of ref_ ' + req.params.ref_ + ' not found.';
            return ControllerService.treat(req, err, found, params, res);
        });
    },

};

