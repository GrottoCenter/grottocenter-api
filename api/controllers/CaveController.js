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
  return {
    // The TCave.create() function doesn't work with TCave field alias. See TCave.js Model
    /* eslint-disable camelcase */
    date_inscription: new Date(),
    depth: req.param('depth'),
    documents: req.param('documents'),
    id_author: req.token.id,
    id_massif: req.param('massif'),
    is_diving: req.param('isDiving'),
    latitude: req.param('latitude'),
    longitude: req.param('longitude'),
    length: req.param('length'),
    massif: req.param('massif'),
    temperature: req.param('temperature'),
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
      .populate('histories')
      .populate('documents')
      .populate('names')
      .exec(async (err, found) => {
        const params = {};
        params.controllerMethod = 'CaveController.find';
        params.searchedItem = `Cave of id ${req.params.id}`;
        params.notFoundMessage = `${params.searchedItem} not found.`;
        if (err) {
          sails.log.error(err);
          return res.serverError(
            'An unexpected server error occured when trying to get ' +
              params.searchedItem,
          );
        }
        if (found) {
          await NameService.setNames([found], 'cave');
          found.histories.map(
            async (h) =>
              (h.author = await CaverService.getCaver(h.author, req)),
          );
        }

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
      .populate('histories')
      .populate('names')
      .sort('id ASC')
      .limit(10)
      .exec(async (err, found) => {
        const params = {};
        params.controllerMethod = 'CaveController.findAll';
        params.searchedItem = 'all caves';
        params.notFoundMessage = 'No caves found.';
        if (err) {
          sails.log.error(err);
          return res.serverError(
            'An unexpected server error occured when trying to get ' +
              params.searchedItem,
          );
        }
        await NameService.setNames(found, 'cave');
        const populatePromise = found.map((cave) => {
          cave.histories.map(
            async (h) =>
              (h.author = await CaverService.getCaver(h.author, req)),
          );
        });
        Promise.all(populatePromise);
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

  create: async (req, res, converter) => {
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

    const rawDescriptionsData = req.param('descriptions');
    const rawNameData = req.param('name');

    // Check params
    if (
      !rawNameData || // name is mandatory
      !rawNameData.text ||
      !rawNameData.language
    ) {
      return res.badRequest(
        `You must provide a complete name object (with attributes "text" and "language").`,
      );
    }

    if (
      rawDescriptionsData // description is optional
    ) {
      for (description of rawDescriptionsData) {
        if (!description.body || !description.language || !description.title) {
          return res.badRequest(
            `For each description, you must provide a complete description object (with attributes "body", "language" and "title").`,
          );
        }
      }
    }

    // Format data
    const cleanedData = getConvertedDataFromClient(req);
    const nameData = {
      ...rawNameData,
      author: req.token.id,
      name: rawNameData.text,
    };
    const descriptionsData = rawDescriptionsData
      ? rawDescriptionsData.map((d) => {
          return {
            ...d,
            author: req.token.id,
          };
        })
      : undefined;

    // Create cave
    try {
      const createdCave = await CaveService.createCave(
        cleanedData,
        nameData,
        descriptionsData,
      );

      const populatedCave = await TCave.findOne(createdCave.id)
        .populate('descriptions')
        .populate('names')
        .populate('documents');
      const params = {};
      params.controllerMethod = 'CaveController.create';
      return ControllerService.treatAndConvert(
        req,
        null,
        populatedCave,
        params,
        res,
        converter,
      );
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
    }
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
    await sails.getDatastore().transaction(async (db) => {
      try {
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
      } catch (e) {
        ErrorService.getDefaultErrorHandler(res)(e);
      }
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

  merge: async (req, res) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.CAVE,
        rightAction: RightService.RightActions.MERGE,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to merge a cave into another one.',
        );
      });
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to merge a cave into another one.',
      );
    }

    // Check if both caves exist and are not deleted
    const sourceCaveId = req.param('sourceCaveId');
    const destinationCaveId = req.param('destinationCaveId');
    const checkIfCaveExists = async (args) =>
      await sails.helpers.checkIfExists.with({
        attributeName: 'id',
        sailsModel: TCave,
        additionalAttributes: { is_deleted: false }, // eslint-disable-line camelcase
        ...args,
      });

    if (!(await checkIfCaveExists({ attributeValue: sourceCaveId }))) {
      return res.badRequest(
        'Source cave with id ' + sourceCaveId + ' not found.',
      );
    }
    if (!(await checkIfCaveExists({ attributeValue: destinationCaveId }))) {
      return res.badRequest(
        'Destination cave with id ' + destinationCaveId + ' not found.',
      );
    }

    // Move source cave data to destination cave
    try {
      await sails.getDatastore().transaction(async (db) => {
        // Move associated data
        await TComment.update({ cave: sourceCaveId })
          .set({ cave: destinationCaveId })
          .usingConnection(db);
        await TDescription.update({ cave: sourceCaveId })
          .set({ cave: destinationCaveId })
          .usingConnection(db);
        await TDocument.update({ cave: sourceCaveId })
          .set({ cave: destinationCaveId })
          .usingConnection(db);
        await TEntrance.update({ cave: sourceCaveId })
          .set({ cave: destinationCaveId })
          .usingConnection(db);
        await THistory.update({ cave: sourceCaveId })
          .set({ cave: destinationCaveId })
          .usingConnection(db);

        // Delete sourceCave names
        await TName.destroy({ cave: sourceCaveId }).usingConnection(db);

        // Handle many-to-many relationships
        const sourceCave = await TCave.findOne(sourceCaveId)
          .populate('exploringGrottos')
          .populate('partneringGrottos')
          .usingConnection(db);
        const destinationCave = await TCave.findOne(destinationCaveId)
          .populate('exploringGrottos')
          .populate('partneringGrottos')
          .usingConnection(db);

        const {
          exploringGrottos: sourceExplorers,
          partneringGrottos: sourcePartners,
        } = sourceCave;
        const {
          exploringGrottos: destinationExplorers,
          partneringGrottos: destinationPartners,
        } = destinationCave;

        // Update explored / partnered caves only if not already explored / partnered by the destination cave.
        for (const sourceExp of sourceExplorers) {
          if (!destinationExplorers.some((g) => g.id === sourceExp.id)) {
            await TCave.addToCollection(
              destinationCaveId,
              'exploringGrottos',
              sourceExp.id,
            ).usingConnection(db);
          }
        }
        for (const sourcePartn of sourcePartners) {
          if (!destinationPartners.some((g) => g.id === sourcePartn.id)) {
            await TCave.addToCollection(
              destinationCaveId,
              'partneringGrottos',
              sourcePartn.id,
            ).usingConnection(db);
          }
        }

        // Destroy remaining source data
        await TCave.removeFromCollection(sourceCaveId, 'exploringGrottos')
          .members(sourceExplorers.map((e) => e.id))
          .usingConnection(db);
        await TCave.removeFromCollection(sourceCaveId, 'partneringGrottos')
          .members(sourcePartners.map((p) => p.id))
          .usingConnection(db);

        // Update cave data with destination data being prioritised
        const mergedData = ramda.mergeWith(
          (a, b) => (b === null ? a : b),
          sourceCave,
          destinationCave,
        );

        const {
          id,
          exploringGrottos,
          partneringGrottos,
          ...cleanedMergedData
        } = mergedData;
        await TCave.update(destinationCaveId)
          .set(cleanedMergedData)
          .usingConnection(db);

        await TCave.destroy(sourceCaveId).usingConnection(db);
      });
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
    }

    return res.status(204);
  },
};
