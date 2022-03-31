/**
 * EntranceController
 *
 * @description :: Server-side logic for managing entrances
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
const ramda = require('ramda');
const DescriptionService = require('../services/DescriptionService');

const CaveService = require('../services/CaveService');
const CaverService = require('../services/CaverService');
const CommentService = require('../services/CommentService');
const ControllerService = require('../services/ControllerService');
const DocumentService = require('../services/DocumentService');
const ElasticsearchService = require('../services/ElasticsearchService');
const EntranceDuplicateService = require('../services/EntranceDuplicateService');
const EntranceService = require('../services/EntranceService');
const ErrorService = require('../services/ErrorService');
const MappingV1Service = require('../services/MappingV1Service');
const NameService = require('../services/NameService');
const RiggingService = require('../services/RiggingService');
const RightService = require('../services/RightService');

const doubleCheck = sails.helpers.csvhelpers.doubleCheck.with;

// Extract everything from the request body except id
const getConvertedDataFromClientRequest = (req) => {
  // remove id if present to avoid null id (and an error)
  const { id, ...reqBodyWithoutId } = req.body;
  return {
    ...reqBodyWithoutId,
    author: req.token.id,
    geology: ramda.propOr('Q35758', 'geology', req.body),
  };
};

const getConvertedNameDescLocFromClientRequest = (req) => {
  let result = {
    name: {
      author: req.token.id,
      text: req.param('name').text,
      language: req.param('name').language,
    },
  };
  if (ramda.pathOr(null, ['description', 'body'], req.body)) {
    result = {
      ...result,
      description: {
        author: req.token.id,
        body: req.body.description.body,
        language: req.body.description.language,
        title: req.body.description.title,
      },
    };
  }

  if (ramda.pathOr(null, ['location', 'body'], req.body)) {
    result = {
      ...result,
      location: {
        author: req.token.id,
        body: req.body.location.body,
        language: req.body.location.language,
      },
    };
  }

  return result;
};

/* _______________________________________

  The following functions are used to extract the relevant information from the import csv module.
  ________________________________________
*/

const getConvertedEntranceFromCsv = (rawData, idAuthor, cave) => {
  const doubleCheckWithData = (args) =>
    doubleCheck.with({ data: rawData, ...args });

  return {
    author: idAuthor,
    country: doubleCheckWithData({
      key: 'gn:countryCode',
    }),
    precision: doubleCheckWithData({
      key: 'dwc:coordinatePrecision',
    }),
    altitude: doubleCheckWithData({
      key: 'w3geo:altitude',
    }),
    latitude: cave.latitude,
    longitude: cave.longitude,
    cave: cave.id,
    dateInscription: doubleCheckWithData({
      key: 'dct:rights/dct:created',
      defaultValue: new Date(),
    }),
    dateReviewed: doubleCheckWithData({
      key: 'dct:rights/dct:modified',
    }),
    isOfInterest: false,
    idDbImport: doubleCheckWithData({
      key: 'id',
    }),
    nameDbImport: doubleCheckWithData({
      key: 'dct:rights/cc:attributionName',
    }),
    // Default value, never provided by csv import
    geology: 'Q35758',
  };
};

const getConvertedNameDescLocEntranceFromCsv = async (rawData, authorId) => {
  const doubleCheckWithData = (args) =>
    sails.helpers.csvhelpers.doubleCheck.with({ data: rawData, ...args });
  let result = {};
  if (
    doubleCheckWithData({
      key: 'karstlink:hasDescriptionDocument/dct:title',
    })
  ) {
    result = {
      description: {
        body: doubleCheckWithData({
          key: 'karstlink:hasDescriptionDocument/dct:description',
        }),
        language: doubleCheckWithData({
          key: 'karstlink:hasDescriptionDocument/dc:language',
          func: (value) => value.toLowerCase(),
        }),
        title: doubleCheckWithData({
          key: 'karstlink:hasDescriptionDocument/dct:title',
        }),
        author: authorId,
        dateInscription: doubleCheckWithData({
          key: 'dct:rights/dct:created',
          defaultValue: new Date(),
        }),
        dateReviewed: doubleCheckWithData({
          key: 'dct:rights/dct:modified',
        }),
      },
    };
  }

  if (doubleCheckWithData({ key: 'rdfs:label' })) {
    result = {
      ...result,
      name: {
        author: authorId,
        text: rawData['rdfs:label'],
        language: doubleCheckWithData({
          key: 'gn:countryCode',
          func: (value) => value.toLowerCase(),
        }),
        dateInscription: doubleCheckWithData({
          key: 'dct:rights/dct:created',
          defaultValue: new Date(),
        }),
        dateReviewed: doubleCheckWithData({
          key: 'dct:rights/dct:modified',
        }),
      },
    };
  }
  if (
    doubleCheckWithData({
      key: 'karstlink:hasAccessDocument/dct:description',
    })
  ) {
    let authorLoc = authorId;
    const authorFromCsv = doubleCheckWithData({
      key: 'karstlink:hasAccessDocument/dct:creator',
    });
    if (authorFromCsv) {
      const auth = await sails.helpers.csvhelpers.getCreator.with({
        creator: authorFromCsv,
      });
      authorLoc = auth.id;
    }
    result = {
      ...result,
      location: {
        body: rawData['karstlink:hasAccessDocument/dct:description'],
        title: doubleCheckWithData({
          key: 'karstlink:hasAccessDocument/dct:description',
        }),
        language: doubleCheckWithData({
          key: 'karstlink:hasAccessDocument/dc:language',
          func: (value) => value.toLowerCase(),
        }),
        author: authorLoc,
        dateInscription: doubleCheckWithData({
          key: 'dct:rights/dct:created',
          defaultValue: new Date(),
        }),
        dateReviewed: doubleCheckWithData({
          key: 'dct:rights/dct:modified',
          defaultValue: undefined,
        }),
      },
    };
  }
  return result;
};

const getConvertedCaveFromCsv = (rawData, idAuthor) => {
  const doubleCheckWithData = (args) =>
    doubleCheck.with({ data: rawData, ...args });

  let depth = doubleCheckWithData({
    key: 'karstlink:verticalExtend',
  });
  if (!depth) {
    depth =
      parseInt(
        doubleCheckWithData({
          key: 'karstlink:extendBelowEntrance',
          defaultValue: 0,
        }),
        10
      ) +
      parseInt(
        doubleCheckWithData({
          key: 'karstlink:extendAboveEntrance',
          defaultValue: 0,
        }),
        10
      );
  }
  return {
    // The TCave.create() function doesn't work with TCave field alias. See TCave.js Model

    id_author: idAuthor,
    latitude: doubleCheckWithData({
      key: 'w3geo:latitude',
    }),
    longitude: doubleCheckWithData({
      key: 'w3geo:longitude',
    }),
    length: doubleCheckWithData({
      key: 'karstlink:length',
    }),
    depth,
    date_inscription: doubleCheckWithData({
      key: 'dct:rights/dct:created',
      defaultValue: new Date(),
    }),
    date_reviewed: doubleCheckWithData({
      key: 'dct:rights/dct:modified',
    }),
  };
};

const getConvertedNameAndDescCaveFromCsv = (rawData, authorId) => {
  const doubleCheckWithData = (args) =>
    doubleCheck.with({ data: rawData, ...args });

  return {
    author: authorId,
    name: doubleCheckWithData({
      key: 'rdfs:label',
    }),
    language: doubleCheckWithData({
      key: 'karstlink:hasDescriptionDocument/dc:language',
      func: (value) => value.toLowerCase(),
    }),
    dateInscription: doubleCheckWithData({
      key: 'dct:rights/dct:created',
      defaultValue: new Date(),
    }),
    dateReviewed: doubleCheckWithData({
      key: 'dct:rights/dct:modified',
    }),
  };
  // No description provided by the csv
};

module.exports = {
  find: async (req, res, converter) => {
    TEntrance.findOne(req.params.id)
      .populate('author')
      .populate('cave')
      .populate('comments')
      .populate('descriptions')
      .populate('documents')
      .populate('geology')
      .populate('histories')
      .populate('locations')
      .populate('names')
      .populate('riggings')
      .exec(async (err, found) => {
        const params = {};
        params.searchedItem = `Entrance of id ${req.params.id}`;

        if (err) {
          sails.log.error(err);
          return res.serverError(
            `An unexpected server error occured when trying to get ${params.searchedItem}`
          );
        }
        if (!found) {
          const notFoundMessage = `${params.searchedItem} not found`;
          sails.log.debug(notFoundMessage);
          res.status(404);
          return res.json({ error: notFoundMessage });
        }

        // Populate massif
        if (found.cave.id_massif) {
          // eslint-disable-next-line no-param-reassign
          found.cave.id_massif = await TMassif.findOne({
            id: found.cave.id_massif,
          })
            .populate('names')
            .populate('descriptions');
          await NameService.setNames([found.cave.id_massif], 'massif');
        }

        // ===== Populate all authors
        // eslint-disable-next-line no-param-reassign
        found.cave.id_author = await CaverService.getCaver(
          found.cave.id_author,
          req
        ); // using id_author because of a bug in Sails ORM... See TCave() file for explaination

        /* eslint-disable no-return-assign */
        /* eslint-disable no-param-reassign */
        found.comments.map(
          async (c) => (c.author = await CaverService.getCaver(c.author, req))
        );
        found.descriptions.map(
          async (d) => (d.author = await CaverService.getCaver(d.author, req))
        );
        found.histories.map(
          async (h) => (h.author = await CaverService.getCaver(h.author, req))
        );
        found.locations.map(
          async (l) => (l.author = await CaverService.getCaver(l.author, req))
        );
        found.riggings.map(
          async (r) => (r.author = await CaverService.getCaver(r.author, req))
        );
        /* eslint-enable no-param-reassign */
        /* eslint-enable no-return-assign */

        // Populate cave
        await CaveService.setEntrances([found.cave]);
        await NameService.setNames([found.cave], 'cave');

        // Populate document type, descriptions, files & license
        await Promise.all(
          found.documents.map(async (d) => {
            await DescriptionService.setDocumentDescriptions(d, false);
            await DocumentService.setDocumentType(d);
            await DocumentService.setDocumentLicense(d);
            await DocumentService.setDocumentFiles(d);
          })
        );

        // Populate stats
        // eslint-disable-next-line no-param-reassign
        found.stats = await CommentService.getStats(req.params.id);

        // Format rigging obstacle
        await RiggingService.formatRiggings(found.riggings);

        // Sensitive entrance special treatment
        if (found.isSensitive) {
          const hasCompleteViewRight = req.token
            ? await sails.helpers.checkRight
                .with({
                  groups: req.token.groups,
                  rightEntity: RightService.RightEntities.ENTRANCE,
                  rightAction: RightService.RightActions.VIEW_COMPLETE,
                })
                .intercept('rightNotFound', () =>
                  res.serverError(
                    'A server error occured when checking your right to entirely view an entrance.'
                  )
                )
            : false;

          const hasLimitedViewRight = req.token
            ? await sails.helpers.checkRight
                .with({
                  groups: req.token.groups,
                  rightEntity: RightService.RightEntities.ENTRANCE,
                  rightAction: RightService.RightActions.VIEW_LIMITED,
                })
                .intercept('rightNotFound', () =>
                  res.serverError(
                    'A server error occured when checking your right to have a limited view of a sensible entrance.'
                  )
                )
            : false;
          if (!hasLimitedViewRight && !hasCompleteViewRight) {
            return res.forbidden(
              'You are not authorized to view this sensible entrance.'
            );
          }
          if (!hasCompleteViewRight) {
            delete found.locations; // eslint-disable-line no-param-reassign
            delete found.longitude; // eslint-disable-line no-param-reassign
            delete found.latitude; // eslint-disable-line no-param-reassign
          }
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

  findRandom: (
    req,
    res,
    next,
    converter = MappingV1Service.convertToEntranceModel
  ) => {
    const params = {};
    params.searchedItem = 'Random entrance';
    EntranceService.findRandom()
      .then((result) => {
        if (!result) {
          return res.notFound();
        }
        return ControllerService.treatAndConvert(
          req,
          null,
          result,
          params,
          res,
          converter
        );
      })
      .catch((err) =>
        ControllerService.treatAndConvert(
          req,
          err,
          undefined,
          params,
          res,
          converter
        )
      );
  },

  publicCount: (req, res, converter) => {
    TEntrance.count({ isPublic: true })
      .then((total) => res.json(converter({ count: total })))
      .catch((err) => {
        const errorMessage =
          'An internal error occurred when getting number of public entrances';
        sails.log.error(`${errorMessage}: ${err}`);
        return res.status(500).json({ error: errorMessage });
      });
  },

  count: (req, res) => {
    TEntrance.count().exec((err, found) => {
      const params = {};
      params.controllerMethod = 'EntranceController.count';
      params.notFoundMessage = 'Problem while getting number of entrances.';

      const count = {};
      count.count = found;
      return ControllerService.treat(req, err, count, params, res);
    });
  },

  // eslint-disable-next-line consistent-return
  create: async (req, res) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ENTRANCE,
        rightAction: RightService.RightActions.CREATE,
      })
      .intercept('rightNotFound', () =>
        res.serverError(
          'A server error occured when checking your right to create an entrance.'
        )
      );
    if (!hasRight) {
      return res.forbidden('You are not authorized to create an entrance.');
    }

    // Check params
    // name
    if (
      !ramda.propOr(null, 'text', req.param('name')) ||
      !ramda.propOr(null, 'language', req.param('name'))
    ) {
      return res.badRequest(
        'You must provide a name (with a language) for the new entrance'
      );
    }

    // cave
    if (!req.param('cave')) {
      return res.badRequest('You must provide a cave id for the new entrance');
    }
    if (
      !(await sails.helpers.checkIfExists.with({
        attributeName: 'id',
        attributeValue: req.param('cave'),
        sailsModel: TCave,
      }))
    ) {
      return res.badRequest(
        `The cave with id ${req.param('cave')} does not exist.`
      );
    }

    // Get data & create entrance
    const cleanedData = {
      ...getConvertedDataFromClientRequest(req),
      dateInscription: new Date(),
      isOfInterest: false,
    };

    const nameDescLocData = getConvertedNameDescLocFromClientRequest(req);

    try {
      const newEntrancePopulated = await EntranceService.createEntrance(
        cleanedData,
        nameDescLocData
      );
      const params = {};
      params.controllerMethod = 'EntranceController.create';
      return ControllerService.treat(
        req,
        null,
        newEntrancePopulated,
        params,
        res
      );
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
      return false;
    }
  },

  delete: async (req, res) => {
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ENTRANCE,
        rightAction: RightService.RightActions.DELETE_ANY,
      })
      .intercept('rightNotFound', () =>
        res.serverError(
          'A server error occured when checking your right to delete an entrance.'
        )
      );
    if (!hasRight) {
      return res.forbidden('You are not authorized to delete an entrance.');
    }

    // Check if entrance exists and if it's not already deleted
    const entranceId = req.param('id');
    const currentEntrance = await TEntrance.findOne(entranceId);
    if (currentEntrance) {
      if (currentEntrance.isDeleted) {
        return res.status(410).send({
          message: `The entrance with id ${entranceId} has already been deleted.`,
        });
      }
    } else {
      return res.status(404).send({
        message: `Entrance of id ${entranceId} not found.`,
      });
    }

    // Delete Entrance
    await TEntrance.destroyOne({
      id: entranceId,
    }).intercept(() =>
      res.serverError(
        `An unexpected error occured when trying to delete entrance with id ${entranceId}.`
      )
    );

    ElasticsearchService.deleteResource('entrances', entranceId);

    return res.sendStatus(204);
  },

  // eslint-disable-next-line consistent-return
  update: async (req, res, converter) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ENTRANCE,
        rightAction: RightService.RightActions.EDIT_ANY,
      })
      .intercept('rightNotFound', () =>
        res.serverError(
          'A server error occured when checking your right to update an entrance.'
        )
      );
    if (!hasRight) {
      return res.forbidden('You are not authorized to update an entrance.');
    }

    // Check if entrance exists
    const entranceId = req.param('id');
    const currentEntrance = await TEntrance.findOne(entranceId);
    if (!currentEntrance) {
      return res.status(404).send({
        message: `Entrance of id ${entranceId} not found.`,
      });
    }

    const cleanedData = {
      ...getConvertedDataFromClientRequest(req),
      id: entranceId,
    };

    // Launch update request using transaction: it performs a rollback if an error occurs
    try {
      await sails.getDatastore().transaction(async (db) => {
        const updatedEntrance = await TEntrance.updateOne({
          id: entranceId,
        })
          .set(cleanedData)
          .usingConnection(db);

        await NameService.setNames([updatedEntrance], 'entrance');

        const params = {};
        params.controllerMethod = 'EntranceController.update';
        return ControllerService.treatAndConvert(
          req,
          null,
          updatedEntrance,
          params,
          res,
          converter
        );
      });
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
      return false;
    }
  },

  // eslint-disable-next-line consistent-return
  updateWithNewEntities: async (req, res, converter) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ENTRANCE,
        rightAction: RightService.RightActions.EDIT_ANY,
      })
      .intercept('rightNotFound', () =>
        res.serverError(
          'A server error occured when checking your right to update an entrance.'
        )
      );
    if (!hasRight) {
      return res.forbidden('You are not authorized to update an entrance.');
    }

    // Check if entrance exists
    const entranceId = req.param('id');
    const currentEntrance = await TEntrance.findOne(entranceId);
    if (!currentEntrance) {
      return res.status(404).send({
        message: `Entrance of id ${entranceId} not found.`,
      });
    }

    const {
      entrance,
      newNames,
      newDescriptions,
      newLocations,
      newRiggings,
      newComments,
    } = req.body;

    const cleanedData = {
      ...entrance,
      id: entranceId,
    };

    const checkForEmptiness = (value) => value && !ramda.isEmpty(value);

    try {
      if (checkForEmptiness(newNames)) {
        const nameParams = newNames.map((name) => ({
          ...name,
          entrance: entranceId,
        }));
        const createdNames = await TName.createEach(nameParams).fetch();
        const createdNamesIds = createdNames.map((name) => name.id);
        cleanedData.names = ramda.concat(cleanedData.names, createdNamesIds);
      }

      if (checkForEmptiness(newDescriptions)) {
        const descParams = newDescriptions.map((desc) => ({
          ...desc,
          entrance: entranceId,
        }));
        const createdDescriptions = await TDescription.createEach(
          descParams
        ).fetch();
        const createdDescriptionsIds = createdDescriptions.map(
          (desc) => desc.id
        );
        cleanedData.descriptions = ramda.concat(
          cleanedData.descriptions,
          createdDescriptionsIds
        );
      }

      if (checkForEmptiness(newLocations)) {
        const locParams = newLocations.map((loc) => ({
          ...loc,
          entrance: entranceId,
        }));
        const createdLoc = await TLocation.createEach(locParams).fetch();
        const createdLocIds = createdLoc.map((loc) => loc.id);
        cleanedData.locations = ramda.concat(
          cleanedData.locations,
          createdLocIds
        );
      }

      if (checkForEmptiness(newRiggings)) {
        const riggingParams = newRiggings.map((rig) => ({
          ...rig,
          entrance: entranceId,
        }));
        const createdRiggings = await TRigging(riggingParams).fetch();
        const createdRiggingsIds = createdRiggings.map((rig) => rig.id);
        cleanedData.riggings = ramda.concat(
          cleanedData.riggings,
          createdRiggingsIds
        );
      }

      if (checkForEmptiness(newComments)) {
        const commentParams = newComments.map((comment) => ({
          ...comment,
          entrance: entranceId,
        }));
        const createdComments = await TComment.createEach(
          commentParams
        ).fetch();
        const createdCommentIds = createdComments.map((comment) => comment.id);
        cleanedData.comments = ramda.concat(
          cleanedData.comments,
          createdCommentIds
        );
      }

      await sails.getDatastore().transaction(async (db) => {
        const updatedEntrance = await TEntrance.updateOne({
          id: entranceId,
        })
          .set(cleanedData)
          .usingConnection(db);

        await NameService.setNames([updatedEntrance], 'entrance');

        const params = {};
        params.controllerMethod = 'EntranceController.update';
        return ControllerService.treatAndConvert(
          req,
          null,
          updatedEntrance,
          params,
          res,
          converter
        );
      });
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
      return false;
    }
  },

  addDocument: async (req, res) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ENTRANCE,
        rightAction: RightService.RightActions.LINK_RESOURCE,
      })
      .intercept('rightNotFound', () =>
        res.serverError(
          'A server error occured when checking your right to add a document to an entrance.'
        )
      );
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to add a document to an entrance.'
      );
    }

    // Check params
    const entranceId = req.param('entranceId');
    const currentEntrance = await TEntrance.findOne(entranceId);
    if (!currentEntrance) {
      return res.status(404).send({
        message: `Entrance of id ${entranceId} not found.`,
      });
    }

    const documentId = req.param('documentId');
    if (
      !(await sails.helpers.checkIfExists.with({
        attributeName: 'id',
        attributeValue: documentId,
        sailsModel: TDocument,
      }))
    ) {
      return res
        .status(404)
        .send({ message: `Document of id ${documentId} not found.` });
    }

    // Update entrance
    TEntrance.addToCollection(entranceId, 'documents', documentId)
      .then(() => res.sendStatus(204))
      .catch({ name: 'UsageError' }, (err) => res.badRequest(err.cause.message))
      .catch({ name: 'AdapterError' }, (err) =>
        res.badRequest(err.cause.message)
      )
      .catch((err) => res.serverError(err.cause.message));
    return res.status(204);
  },

  unlinkDocument: async (req, res) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ENTRANCE,
        rightAction: RightService.RightActions.UNLINK_RESOURCE,
      })
      .intercept('rightNotFound', () =>
        res.serverError(
          'A server error occured when checking your right to remove a document from an entrance.'
        )
      );
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to remove a document from an entrance.'
      );
    }

    // Check params
    const entranceId = req.param('entranceId');
    const currentEntrance = await TEntrance.findOne(entranceId);
    if (!currentEntrance) {
      return res.status(404).send({
        message: `Entrance of id ${entranceId} not found.`,
      });
    }

    const documentId = req.param('documentId');
    if (!(await DocumentService.checkIfExists('id', documentId))) {
      return res
        .status(404)
        .send({ message: `Document of id ${documentId} not found.` });
    }

    // Update entrance
    TEntrance.removeFromCollection(entranceId, 'documents', documentId)
      .then(() => res.sendStatus(204))
      .catch({ name: 'UsageError' }, (err) => res.badRequest(err.cause.message))
      .catch({ name: 'AdapterError' }, (err) =>
        res.badRequest(err.cause.message)
      )
      .catch((err) => res.serverError(err.cause.message));
    return res.status(204);
  },

  checkRows: async (req, res) => {
    const willBeCreated = [];
    const willBeCreatedAsDuplicates = [];
    const wontBeCreated = [];
    for (const [index, row] of req.body.data.entries()) {
      const idDb = doubleCheck({
        data: row,
        key: 'id',
        defaultValue: undefined,
      });
      const nameDb = doubleCheck({
        data: row,
        key: 'dct:rights/cc:attributionName',
        defaultValue: undefined,
      });

      // Stop if no id and name provided
      if (!(idDb && nameDb)) {
        wontBeCreated.push({
          line: index + 2,
        });
        continue; // eslint-disable-line no-continue
      }

      // Check for duplicates
      // eslint-disable-next-line no-await-in-loop
      const result = await TEntrance.find({
        idDbImport: idDb,
        nameDbImport: nameDb,
      });
      if (result.length === 0) {
        willBeCreated.push(row);
      } else {
        willBeCreatedAsDuplicates.push(row);
      }
    }

    const requestResult = {
      willBeCreated,
      willBeCreatedAsDuplicates,
      wontBeCreated,
    };
    return res.ok(requestResult);
  },

  importRows: async (req, res) => {
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ENTRANCE,
        rightAction: RightService.RightActions.CSV_IMPORT,
      })
      .intercept('rightNotFound', () =>
        res.serverError(
          'A server error occured when checking your right to import entrances via CSV.'
        )
      );
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to import entrances via CSV.'
      );
    }

    const requestResponse = {
      type: 'entrance',
      total: {
        success: 0,
        failure: 0,
      },
      successfulImport: [],
      successfulImportAsDuplicates: [],
      failureImport: [],
    };

    /* eslint-disable no-await-in-loop */
    for (const [index, data] of req.body.data.entries()) {
      const missingColumns = await sails.helpers.csvhelpers.checkColumns.with({
        data,
        additionalColumns: ['w3geo:latitude', 'w3geo:longitude'],
      });

      // Stop if missing columnes
      if (missingColumns.length > 0) {
        requestResponse.failureImport.push({
          line: index + 2,
          message: `Columns missing : ${missingColumns.toString()}`,
        });
        continue; // eslint-disable-line no-continue
      }

      // Check for duplicates
      const idDb = doubleCheck({
        data,
        key: 'id',
        defaultValue: undefined,
      });
      const nameDb = doubleCheck({
        data,
        key: 'dct:rights/cc:attributionName',
        defaultValue: undefined,
      });

      try {
        // Get data
        // Author retrieval: create one if not present in db
        const authorId = await sails.helpers.csvhelpers.getAuthor(data);
        const dataNameDescLoc = await getConvertedNameDescLocEntranceFromCsv(
          data,
          authorId
        );

        const result = await TEntrance.find({
          idDbImport: idDb,
          nameDbImport: nameDb,
        });
        if (result.length !== 0) {
          // Create a duplicate in DB
          const cave = await TCave.findOne(result[0].cave);
          const entrance = getConvertedEntranceFromCsv(data, authorId, cave);

          const duplicateContent = {
            entrance,
            nameDescLoc: dataNameDescLoc,
          };

          await EntranceDuplicateService.create(
            req.token.id,
            duplicateContent,
            result[0].id
          );

          requestResponse.successfulImportAsDuplicates.push({
            line: index + 2,
            message: `Entrance with id ${idDb} has been created as an entrance duplicate.`,
          });
          continue; // eslint-disable-line no-continue
        }

        // Cave creation
        const dataCave = getConvertedCaveFromCsv(data, authorId);
        const nameData = getConvertedNameAndDescCaveFromCsv(data, authorId);
        const createdCave = await CaveService.createCave(dataCave, nameData);

        // Entrance creation
        const dataEntrance = getConvertedEntranceFromCsv(
          data,
          authorId,
          createdCave
        );
        const { dateInscription } = dataEntrance;
        const { dateReviewed } = dataEntrance;

        const createdEntrance = await EntranceService.createEntrance(
          dataEntrance,
          dataNameDescLoc
        );
        if (
          doubleCheck({
            data,
            key: 'gn:alternateName',
            defaultValue: null,
          })
        ) {
          await TName.create({
            author: authorId,
            entrance: createdEntrance.id,
            dateInscription,
            dateReviewed,
            isMain: false,
            language: dataNameDescLoc.name.language,
            name: data['gn:alternateName'].name,
          });
        }

        requestResponse.successfulImport.push({
          caveId: createdCave.id,
          entranceId: createdEntrance.id,
          latitude: createdEntrance.latitude,
          longitude: createdEntrance.longitude,
        });
      } catch (err) {
        sails.log.error(err);
        requestResponse.failureImport.push({
          line: index + 2,
          message: err.toString(),
        });
      }
    }
    /* eslint-enable no-await-in-loop */

    requestResponse.total.success = requestResponse.successfulImport.length;
    requestResponse.total.successfulImportAsDuplicates =
      requestResponse.successfulImportAsDuplicates.length;
    requestResponse.total.failure = requestResponse.failureImport.length;
    return res.ok(requestResponse);
  },
};
