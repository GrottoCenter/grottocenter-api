/**
 * TopographyController.js
 *
 * @description :: tTopography controller
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */
module.exports = {
  create: function(req, res) {
    return res.badRequest('TopographyController.create not yet implemented!');
  },

  update: function(req, res) {
    return res.badRequest('TopographyController.update not yet implemented!');
  },

  delete: function(req, res) {
    return res.badRequest('TopographyController.delete not yet implemented!');
  },

  find: function(req, res) {
    TTopography.findOneById(req.params.id).populate('author').populate('files').populate('entries').exec(function(err, found) {
      var params = {};
      params.controllerMethod = 'TopographyController.find';
      params.notFoundMessage = 'Topography of id ' + req.params.id + ' not found.';
      return ControllerService.treat(err, found, params, res);
    });
  },

  findAll: function(req, res) {
    TTopography.find().populate('author').populate('files').populate('entries').sort('id ASC').limit(10).exec(function(err, found) {
      var params = {};
      params.controllerMethod = 'TopographyController.findAll';
      params.notFoundMessage = 'No topographies found.';
      return ControllerService.treat(err, found, params, res);
    });
  }
};
