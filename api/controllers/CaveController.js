/**
 * CaveController
 *
 * @description :: Server-side logic for managing Caves
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const CaveService = require('../services/CaveService');
const CaverService = require('../services/CaverService');
const ControllerService = require('../services/ControllerService');
const ErrorService = require('../services/ErrorService');
const MappingV1Service = require('../services/MappingV1Service');
const NameService = require('../services/NameService');
const RightService = require('../services/RightService');

// Extract everything from the request body except id and dateInscription
const getConvertedDataFromClient = (req) => ({
  // The TCave.create() function doesn't work with TCave field alias. See TCave.js Model
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
});

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
            `An unexpected server error occured when trying to get ${params.searchedItem}`
          );
        }
        if (found) {
          await NameService.setNames([found], 'cave');
          found.histories.map(async (h) => {
            // eslint-disable-next-line no-param-reassign
            h.author = await CaverService.getCaver(h.author, req);
            return h;
          });
        }

        return ControllerService.treatAndConvert(
          req,
          err,
          found,
          params,
          res,
          converter
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
            `An unexpected server error occured when trying to get ${params.searchedItem}`
          );
        }
        await NameService.setNames(found, 'cave');
        const populatePromise = found.map((cave) => {
          cave.histories.map(async (h) => {
            // eslint-disable-next-line no-param-reassign
            h.author = await CaverService.getCaver(h.author, req);
            return h;
          });
          return cave;
        });
        Promise.all(populatePromise);
        return ControllerService.treatAndConvert(
          req,
          err,
          found,
          params,
          res,
          converter
        );
      });
  },

  // eslint-disable-next-line consistent-return
  create: async (req, res, converter) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.CAVE,
        rightAction: RightService.RightActions.CREATE,
      })
      .intercept('rightNotFound', () =>
        res.serverError(
          'A server error occured when checking your right to create a cave.'
        )
      );
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
        'You must provide a complete name object (with attributes "text" and "language").'
      );
    }

    if (
      rawDescriptionsData // description is optional
    ) {
      for (const description of rawDescriptionsData) {
        if (!description.body || !description.language || !description.title) {
          return res.badRequest(
            'For each description, you must provide a complete description object (with attributes "body", "language" and "title").'
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
      ? rawDescriptionsData.map((d) => ({
          ...d,
          author: req.token.id,
        }))
      : undefined;

    // Create cave
    try {
      const createdCave = await CaveService.createCave(
        cleanedData,
        nameData,
        descriptionsData
      );

      const populatedCave = await TCave.findOne(createdCave.id)
        .populate('descriptions')
        .populate('documents')
        .populate('histories')
        .populate('names');

      const params = {};
      params.controllerMethod = 'CaveController.create';
      return ControllerService.treatAndConvert(
        req,
        null,
        populatedCave,
        params,
        res,
        converter
      );
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
      return false;
    }
  },

  // eslint-disable-next-line consistent-return
  delete: async (req, res) => {
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.CAVE,
        rightAction: RightService.RightActions.DELETE_ANY,
      })
      .intercept('rightNotFound', () =>
        res.serverError(
          'A server error occured when checking your right to delete a cave.'
        )
      );
    if (!hasRight) {
      return res.forbidden('You are not authorized to delete a cave.');
    }

    // Check if cave exists and is not deleted
    const caveId = req.param('id');
    const { checkIfExists } = sails.helpers;
    const checkIfCaveExists = async (args) =>
      // eslint-disable-next-line no-return-await
      await checkIfExists.with({
        attributeName: 'id',
        sailsModel: TCave,
        additionalAttributes: { is_deleted: false },
        ...args,
      });

    if (!(await checkIfCaveExists({ attributeValue: caveId }))) {
      return res.badRequest(`Cave with id ${caveId} not found.`);
    }

    // Merge cave with another one before deleting it
    if (req.param('destinationCaveForOrphan')) {
      const destinationCaveId = req.param('destinationCaveForOrphan');
      if (!(await checkIfCaveExists({ attributeValue: destinationCaveId }))) {
        return res.badRequest(
          `Destination cave with id ${destinationCaveId} not found.`
        );
      }

      // Check right
      const hasMergeRight = await sails.helpers.checkRight
        .with({
          groups: req.token.groups,
          rightEntity: RightService.RightEntities.CAVE,
          rightAction: RightService.RightActions.MERGE,
        })
        .intercept('rightNotFound', () =>
          res.serverError(
            'A server error occured when checking your right to merge a cave into another one.'
          )
        );
      if (!hasMergeRight) {
        return res.forbidden(
          'You are not authorized to merge a cave into another one.'
        );
      }
      try {
        await CaveService.mergeCaves(caveId, destinationCaveId);
      } catch (e) {
        ErrorService.getDefaultErrorHandler(res)(e);
      }
    }

    // Delete cave
    try {
      sails.log.info(`Deleting cave with id ${caveId}`);
      await TCave.destroyOne(caveId);
      return res.sendStatus(204);
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
      return false;
    }
  },

  // eslint-disable-next-line consistent-return
  addDocument: async (req, res) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.CAVE,
        rightAction: RightService.RightActions.LINK_RESOURCE,
      })
      .intercept('rightNotFound', () =>
        res.serverError(
          'A server error occured when checking your right to add a document to a cave.'
        )
      );
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to add a document to a cave.'
      );
    }

    // Check params
    const caveId = req.param('caveId');
    if (!(await sails.helpers.checkIfExists('id', caveId, TCave))) {
      return res.status(404).send({
        message: `Cave with id ${caveId} not found.`,
      });
    }

    const documentId = req.param('documentId');
    if (!(await sails.helpers.checkIfExists('id', documentId, TDocument))) {
      return res.status(404).send({
        message: `Document with id ${documentId} not found.`,
      });
    }

    // Update cave
    try {
      await TCave.addToCollection(caveId, 'documents', documentId);
      return res.sendStatus(204);
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
      return false;
    }
  },

  // eslint-disable-next-line consistent-return
  update: async (req, res, converter) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.CAVE,
        rightAction: RightService.RightActions.EDIT_ANY,
      })
      .intercept('rightNotFound', () =>
        res.serverError(
          'A server error occured when checking your right to update a cave.'
        )
      );
    if (!hasRight) {
      return res.forbidden('You are not authorized to update a cave.');
    }

    // Check if cave exists
    const caveId = req.param('id');
    const currentCave = await TCave.findOne(caveId);
    if (!currentCave) {
      return res.status(404).send({
        message: `Cave with id ${caveId} not found.`,
      });
    }

    const cleanedData = {
      ...getConvertedDataFromClient(req),
      id: caveId,
    };

    // Launch update request using transaction: it performs a rollback if an error occurs
    // eslint-disable-next-line consistent-return
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
          converter
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
      .intercept('rightNotFound', () =>
        res.serverError(
          'A server error occured when checking your right to add a cave to a massif.'
        )
      );
    if (!hasRight) {
      return res.forbidden('You are not authorized to add a cave to a massif.');
    }

    // Check params
    const caveId = req.param('caveId');
    if (!(await sails.helpers.checkIfExists('id', caveId, TCave))) {
      return res
        .status(404)
        .send({ message: `Cave with id ${caveId} not found.` });
    }

    const massifId = req.param('massifId');
    if (!(await sails.helpers.checkIfExists('id', massifId, TMassif))) {
      return res
        .status(404)
        .send({ message: `Massif with id ${massifId} not found.` });
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
