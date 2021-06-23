/**
 * EntranceController
 *
 * @description :: Server-side logic for managing entrances
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
const ramda = require('ramda');
const esClient = require('../../config/elasticsearch').elasticsearchCli;

// Extract everything from the request body except id
const getConvertedDataFromClientRequest = (req) => {
  const { id, ...reqBodyWithoutId } = req.body; // remove id if present to avoid null id (and an error)
  return {
    ...reqBodyWithoutId,
    author: req.token.id,
    cave: ramda.pathOr(undefined, ['cave', 'id'], req.body),
    country: ramda.pathOr(undefined, ['country', 'id'], req.body),
    geology: ramda.pathOr('Q35758', ['geology', 'id'], req.body),
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

module.exports = {
  find: async (req, res, converter) => {
    TEntrance.findOne(req.params.id)
      .populate('author')
      .populate('cave')
      .populate('names')
      .populate('descriptions')
      .populate('geology')
      .populate('locations')
      .populate('documents')
      .populate('riggings')
      .populate('comments')
      .exec(async (err, found) => {
        const params = {};
        params.searchedItem = `Entrance of id ${req.params.id}`;

        if (!found) {
          const notFoundMessage = `${params.searchedItem} not found`;
          sails.log.debug(notFoundMessage);
          res.status(404);
          return res.json({ error: notFoundMessage });
        }

        // Populate massif
        if (found.cave.id_massif) {
          // eslint-disable-next-line camelcase
          found.cave.id_massif = await TMassif.findOne({
            id: found.cave.id_massif, // eslint-disable-line camelcase
          })
            .populate('names')
            .populate('descriptions');
          await NameService.setNames([found.cave.id_massif], 'massif');
        }

        await CaveService.setEntrances([found.cave]);
        await NameService.setNames([found.cave], 'cave');

        // Populate stats
        const statsPromise = CommentService.getStats(req.params.id);
        statsPromise.then(async (stats) => {
          found.stats = stats;

          // Sensitive entrance special treatment
          if (found.isSensitive) {
            const hasCompleteViewRight = req.token
              ? await sails.helpers.checkRight
                  .with({
                    groups: req.token.groups,
                    rightEntity: RightService.RightEntities.ENTRANCE,
                    rightAction: RightService.RightActions.VIEW_COMPLETE,
                  })
                  .intercept('rightNotFound', (err) => {
                    return res.serverError(
                      'A server error occured when checking your right to entirely view an entrance.',
                    );
                  })
              : false;

            const hasLimitedViewRight = req.token
              ? await sails.helpers.checkRight
                  .with({
                    groups: req.token.groups,
                    rightEntity: RightService.RightEntities.ENTRANCE,
                    rightAction: RightService.RightActions.VIEW_LIMITED,
                  })
                  .intercept('rightNotFound', (err) => {
                    return res.serverError(
                      'A server error occured when checking your right to have a limited view of a sensible entrance.',
                    );
                  })
              : false;
            if (!hasLimitedViewRight && !hasCompleteViewRight) {
              return res.forbidden(
                'You are not authorized to view this sensible entrance.',
              );
            }
            if (!hasCompleteViewRight) {
              delete found.locations;
              delete found.longitude;
              delete found.latitude;
            }
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
      });
  },

  findRandom: (
    req,
    res,
    next,
    converter = MappingV1Service.convertToEntranceModel,
  ) => {
    const params = {};
    params.searchedItem = `Random entrance`;
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
          converter,
        );
      })
      .catch((err) => {
        return ControllerService.treatAndConvert(
          req,
          err,
          undefined,
          params,
          res,
          converter,
        );
      });
  },

  publicCount: (req, res, converter) => {
    TEntrance.count({ isPublic: true })
      .then((total) => {
        return res.json(converter({ count: total }));
      })
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

  create: async (req, res) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ENTRANCE,
        rightAction: RightService.RightActions.CREATE,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to create an entrance.',
        );
      });
    if (!hasRight) {
      return res.forbidden('You are not authorized to create an entrance.');
    }

    const cleanedData = {
      ...getConvertedDataFromClientRequest(req),
      dateInscription: new Date(),
      isOfInterest: false,
    };

    const nameDescLocData = getConvertedNameDescLocFromClientRequest(req);

    const handleError = (error) => {
      if(error.code && error.code === 'E_UNIQUE'){
        return res.sendStatus(409);
      } else {
        switch(error.name){
          case 'UsageError':
            return res.badRequest(error);
          case 'AdapterError':
            return res.badRequest(error);
          default:
            return res.serverError(error);
        }
      }
    };

    // Launch creation request using transaction: it performs a rollback if an error occurs
    const newEntrancePopulated = await EntranceService.createEntrance(cleanedData, nameDescLocData, handleError, esClient);
      

    const params = {};
    params.controllerMethod = 'EntranceController.create';
    return ControllerService.treat(
      req,
      null,
      newEntrancePopulated,
      params,
      res,
    );
  },

  delete: async (req, res) => {
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ENTRANCE,
        rightAction: RightService.RightActions.DELETE_ANY,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to delete an entrance.',
        );
      });
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
    const updatedEntrance = await TEntrance.destroyOne({
      id: entranceId,
    }).intercept((err) => {
      return res.serverError(
        `An unexpected error occured when trying to delete entrance with id ${entranceId}.`,
      );
    });

    ElasticsearchService.deleteResource('entrances', entranceId);

    return res.sendStatus(204);
  },

  update: async (req, res, converter) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ENTRANCE,
        rightAction: RightService.RightActions.EDIT_ANY,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to update an entrance.',
        );
      });
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
    await sails
      .getDatastore()
      .transaction(async (db) => {
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

  addDocument: async (req, res) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ENTRANCE,
        rightAction: RightService.RightActions.LINK_RESOURCE,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to add a document to an entrance.',
        );
      });
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to add a document to an entrance.',
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

  unlinkDocument: async (req, res) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ENTRANCE,
        rightAction: RightService.RightActions.UNLINK_RESOURCE,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to remove a document from an entrance.',
        );
      });
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to remove a document from an entrance.',
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
};
