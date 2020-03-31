/**
 * TopographyController.js
 *
 * @description :: tTopography controller
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {
  create: (req, res) => res.badRequest('TopographyController.create not yet implemented!'),

  update: (req, res) => res.badRequest('TopographyController.update not yet implemented!'),

  delete: (req, res) => res.badRequest('TopographyController.delete not yet implemented!'),

  find: (req, res) => {
    TTopography.findOneById(req.params.id)
      .populate('author')
      .populate('files')
      .populate('entries')
      .exec((err, found) => {
        const params = {};
        params.controllerMethod = 'TopographyController.find';
        params.notFoundMessage = `Topography of id ${req.params.id} not found.`;
        return ControllerService.treat(req, err, found, params, res);
      });
  },

  findAll: (req, res) => {
    TTopography.find()
      .populate('author')
      .populate('files')
      .populate('entries')
      .sort('id ASC')
      .limit(10)
      .exec((err, found) => {
        const params = {};
        params.controllerMethod = 'TopographyController.findAll';
        params.notFoundMessage = 'No topographies found.';
        return ControllerService.treat(req, err, found, params, res);
      });
  },
};
