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

  delete: async (req, res) => {
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.CAVE,
        rightAction: RightService.RightActions.DELETE_ANY,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to delete a cave.',
        );
      });
    if (!hasRight) {
      return res.forbidden('You are not authorized to delete a cave.');
    }

    // Check if cave exists and if it's not already deleted
    const caveId = req.param('id');
    const currentCave = await TCave.findOne(caveId);
    if (currentCave) {
      if (currentCave.isDeleted) {
        return res.status(410).send({
          message: `The cave with id ${caveId} has already been deleted.`,
        });
      }
    } else {
      return res.status(404).send({
        message: `Cave of id ${caveId} not found.`,
      });
    }
    // Delete cave
    const updatedCave = await TCave.destroyOne({ id: caveId }).intercept(
      (err) => {
        return res.serverError(
          `An unexpected error occured when trying to delete cave with id ${caveId}.`,
        );
      },
    );
    return res.sendStatus(204);
  },
};
