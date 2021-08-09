/**
 * CaveController
 *
 * @description :: Server-side logic for managing Caves
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const ramda = require('ramda');
const NameService = require('../services/NameService');

// Extract everything from the request body except id and dateInscription
const getConvertedDataFromClient = (req) => {
  const {
    id,
    dateInscription,
    ...reqBodyWithoutIdAndDateInscription
  } = req.body; // remove id and dateInscription if present to avoid null id (and an error)
  return {
    ...reqBodyWithoutIdAndDateInscription,
    // The TCave.create() function doesn't work with TCave field alias. See TCave.js Model
    /* eslint-disable camelcase */
    id_author: req.token.id,
    date_inscription: new Date(),
    documents: ramda.propOr(undefined, 'documents', req.body)
      ? req.body.documents.map((d) => d.id)
      : undefined,
    id_massif: ramda.pathOr(undefined, ['massif', 'id'], req.body),
    /* eslint-enable camelcase */
  };
};

module.exports = {
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
      ...getConvertedDataFromClient(req),
      dateInscription: new Date(),
    };

    let nameAndDescData = {
      author: req.token.id,
      name: req.param('name'),
      descriptionAndNameLanguage: {
        id: req.body.descriptionAndNameLanguage.id,
      },
    };
    if (ramda.propOr(null, 'description', req.body)) {
      nameAndDescData = {
        ...nameAndDescData,
        description: req.body.description,
        descriptionTitle: req.body.title,
      };
    }
    const handleError = (error) => {
      if (error.code && error.code === 'E_UNIQUE') {
        return res.sendStatus(409);
      } else {
        switch (error.name) {
          case 'UsageError':
            return res.badRequest(error.message);
          case 'AdapterError':
            return res.badRequest(error.message);
          default:
            return res.serverError(error.message);
        }
      }
    };

    const caveCreated = await CaveService.createCave(
      cleanedData,
      nameAndDescData,
      handleError,
    );

    const params = {};
    params.controllerMethod = 'CaveController.create';
    return ControllerService.treat(req, null, caveCreated, params, res);
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

  addDocument: async (req, res) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.CAVE,
        rightAction: RightService.RightActions.LINK_RESOURCE,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to add a document to a cave.',
        );
      });
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to add a document to a cave.',
      );
    }

    // Check params
    const caveId = req.param('caveId');
    const currentCave = await TCave.findOne(caveId);
    if (!currentCave) {
      return res.status(404).send({
        message: `Cave of id ${caveId} not found.`,
      });
    }

    const documentId = req.param('documentId');
    const currentDocument = await TDocument.findOne(documentId);
    if (!currentDocument) {
      return res.status(404).send({
        message: `Document of id ${documentId} not found.`,
      });
    }

    // Update cave
    TCave.addToCollection(caveId, 'documents', documentId)
      .then(() => {
        return res.sendStatus(204);
      })
      .catch({ name: 'UsageError' }, (err) => {
        return res.badRequest(err.cause.message);
      })
      .catch({ name: 'AdapterError' }, (err) => {
        return res.badRequest(err.cause.message);
      })
      .catch((err) => {
        return res.serverError(err.cause.message);
      });
  },

  update: async (req, res, converter) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.CAVE,
        rightAction: RightService.RightActions.EDIT_ANY,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to update a cave.',
        );
      });
    if (!hasRight) {
      return res.forbidden('You are not authorized to update a cave.');
    }

    // Check if cave exists
    const caveId = req.param('id');
    const currentCave = await TCave.findOne(caveId);
    if (!currentCave) {
      return res.status(404).send({
        message: `Cave of id ${caveId} not found.`,
      });
    }

    const cleanedData = {
      ...getConvertedDataFromClient(req),
      id: caveId,
    };

    // Launch update request using transaction: it performs a rollback if an error occurs
    await sails
      .getDatastore()
      .transaction(async (db) => {
        const updatedCave = await TCave.updateOne({
          id: caveId,
        })
          .set(cleanedData)
          .usingConnection(db);

        await NameService.setNames([updatedCave], 'cave');

        const params = {};
        params.controllerMethod = 'CaveController.update';
        return ControllerService.treatAndConvert(
          req,
          null,
          updatedCave,
          params,
          res,
          converter,
        );
      })
      .intercept('E_UNIQUE', (e) => {
        sails.log.error(e.message);
        return res.status(409).send(e.message);
      })
      .intercept({ name: 'UsageError' }, (e) => {
        sails.log.error(e.message);
        return res.badRequest(e.message);
      })
      .intercept({ name: 'AdapterError' }, (e) => {
        sails.log.error(e.message);
        return res.badRequest(e.message);
      })
      .intercept((e) => {
        sails.log.error(e.message);
        return res.serverError(e.message);
      });
  },

  setMassif: async (req, res) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.CAVE,
        rightAction: RightService.RightActions.EDIT_ANY,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to add a cave to a massif.',
        );
      });
    if (!hasRight) {
      return res.forbidden('You are not authorized to add a cave to a massif.');
    }

    // Check params
    const caveId = req.param('caveId');
    const currentCave = await TCave.findOne(caveId);
    if (!currentCave) {
      return res.badRequest(`Could not find cave with id ${caveId}.`);
    }

    const massifId = req.param('massifId');
    const currentMassif = await TMassif.findOne(massifId);
    if (!currentMassif) {
      return res.badRequest(`Could not find massif with id ${massifId}.`);
    }

    // Update cave
    await TCave.updateOne({
      id: caveId,
    }).set({
      massif: massifId,
    });
    return res.sendStatus(204);
  },
};
