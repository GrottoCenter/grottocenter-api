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

  find: (req, res, next, converter = MappingV1Service.convertToCaveModel) => {
    TCave.findOne(req.params.id)
      .populate('author')
      .populate('reviewer')
      .populate('entrances')
      .populate('descriptions')
      .populate('documents')
      .populate('names')
      .exec(async (err, found) => {
        await NameService.setNames([found], 'cave');
        const params = {};
        params.controllerMethod = 'CaveController.find';
        params.searchedItem = `Cave of id ${req.params.id}`;
        params.notFoundMessage = `Cave of id ${req.params.id} not found.`;
        return ControllerService.treatAndConvert(
          req,
          err,
          found,
          params,
          res,
          converter,
        );
      });
  },

  findAll: (req, res, converter) => {
    const parameters = {};

    return TCave.find(parameters)
      .populate('author')
      .populate('entrances')
      .sort('id ASC')
      .limit(10)
      .exec((err, found) => {
        const params = {};
        params.controllerMethod = 'CaveController.findAll';
        params.notFoundMessage = 'No caves found.';
        return ControllerService.treat(req, err, found, params, res, converter);
      });
  },
};
