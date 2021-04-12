/**
 * CaveController
 *
 * @description :: Server-side logic for managing Caves
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const ramda = require('ramda');

module.exports = {
  update: (req, res) =>
    res.badRequest('CaveController.update not yet implemented!'),

  find: (req, res, next, converter = MappingV1Service.convertToCaveModel) => {
    TCave.findOne(req.params.id)
      .populate('id_author')
      .populate('id_reviewer')
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
      .populate('id_author')
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

  create: async (req, res) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.CAVE,
        rightAction: RightService.RightActions.CREATE,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to create a cave.',
        );
      });
    if (!hasRight) {
      return res.forbidden('You are not authorized to create a cave.');
    }

    // Check params
    if (!req.param('name')) {
      return res.badRequest(`You must provide a name to create a new cave.`);
    }

    const cleanedData = {
      // The TCave.create() function doesn't work with TCave field alias. See TCave.js Model
      /* eslint-disable camelcase */
      ...req.body,
      id_author: req.token.id,
      date_inscription: new Date(),
      documents: ramda.propOr(undefined, 'documents', req.body)
        ? req.body.documents.map((d) => d.id)
        : undefined,
      id_massif: ramda.pathOr(undefined, ['massif', 'id'], req.body),
      /* eslint-enable camelcase */
    };

    // Launch creation request using transaction: it performs a rollback if an error occurs
    await sails
      .getDatastore()
      .transaction(async (db) => {
        const caveCreated = await TCave.create(cleanedData)
          .fetch()
          .usingConnection(db);

        await TName.create({
          author: req.token.id,
          cave: caveCreated.id,
          dateInscription: new Date(),
          isMain: true,
          language: req.body.descriptionAndNameLanguage.id,
          name: req.param('name'),
        }).usingConnection(db);

        // Description (if provided)
        if (ramda.propOr(null, 'description', req.body) !== null) {
          await TDescription.create({
            author: req.token.id,
            body: req.body.description,
            cave: caveCreated.id,
            dateInscription: new Date(),
            language: req.body.descriptionAndNameLanguage.id,
            title: req.body.descriptionTitle,
          }).usingConnection(db);
        }

        const params = {};
        params.controllerMethod = 'CaveController.create';
        return ControllerService.treat(req, null, caveCreated, params, res);
      })
      .intercept('E_UNIQUE', () => res.sendStatus(409))
      .intercept('UsageError', (e) => res.badRequest(e.cause.message))
      .intercept('AdapterError', (e) => res.badRequest(e.cause.message))
      .intercept((e) => res.serverError(e.message));
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
