/**
 * CaveController
 *
 * @description :: Server-side logic for managing Caves
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  create: (req, res) =>
    res.badRequest('CaveController.create not yet implemented!'),

  update: (req, res) =>
    res.badRequest('CaveController.update not yet implemented!'),

  delete: (req, res) =>
    res.badRequest('CaveController.delete not yet implemented!'),

  find: (req, res) => {
    TCave.findOne({
      id: req.params.id,
    })
      .populate('author')
      .populate('reviewer')
      .populate('entrances')
      .populate('descriptions')
      .populate('documents')
      .exec((err, found) => {
        const params = {};
        params.controllerMethod = 'CaveController.find';
        params.notFoundMessage = `Cave of id ${req.params.id} not found.`;
        return ControllerService.treat(req, err, found, params, res);
      });
  },

  findAll: (req, res) => {
    const parameters = {};
    if (req.params.name) {
      parameters.name = {
        like: `%${req.param('name')}%`,
      };
      sails.log.debug(`parameters ${parameters.name.like}`);
    }

    return TCave.find(parameters)
      .populate('author')
      .populate('entrances')
      .sort('id ASC')
      .limit(10)
      .exec((err, found) => {
        const params = {};
        params.controllerMethod = 'CaveController.findAll';
        params.notFoundMessage = 'No caves found.';
        return ControllerService.treat(req, err, found, params, res);
      });
  },
};
