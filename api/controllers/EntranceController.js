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

module.exports = {
  find: (req, res, converter) => {
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
      .exec((err, found) => {
        const params = {};
        params.searchedItem = `Entrance of id ${req.params.id}`;

        if (!found) {
          const notFoundMessage = `${params.searchedItem} not found`;
          sails.log.debug(notFoundMessage);
          res.status(404);
          return res.json({ error: notFoundMessage });
        }

        // Populate stats
        const statsPromise = CommentService.getStats(req.params.id);
        statsPromise.then((stats) => {
          found.stats = stats;
          if (!found.isPublic) {
            // TODO: Some people (admin ? use RightHelper with a right in DB ?) should be able to get the full data even for the "not public" entrances.
            delete found.locations;
            delete found.longitude;
            delete found.latitude;
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

    // Launch creation request using transaction: it performs a rollback if an error occurs
    const newEntrancePopulated = await sails
      .getDatastore()
      .transaction(async (db) => {
        const cleanedData = {
          ...getConvertedDataFromClientRequest(req),
          dateInscription: new Date(),
          isOfInterest: false,
        };

        const newEntrance = await TEntrance.create(cleanedData)
          .fetch()
          .usingConnection(db);

        // Name
        const entranceName = await TName.create({
          author: req.token.id,
          dateInscription: new Date(),
          entrance: newEntrance.id,
          isMain: true,
          language: req.param('name').language,
          name: req.param('name').text,
        })
          .fetch()
          .usingConnection(db);

        // Description (if provided)
        if (ramda.pathOr(null, ['description', 'body'], req.body)) {
          await TDescription.create({
            author: req.token.id,
            body: req.body.description.body,
            dateInscription: new Date(),
            entrance: newEntrance.id,
            language: req.body.description.language,
            title: req.body.description.title,
          }).usingConnection(db);
        }

        // Location (if provided)
        if (ramda.pathOr(null, ['location', 'body'], req.body)) {
          await TLocation.create({
            author: req.token.id,
            body: req.body.location.body,
            dateInscription: new Date(),
            entrance: newEntrance.id,
            language: req.body.location.language,
          }).usingConnection(db);
        }

        // Prepare data for Elasticsearch indexation
        const newEntrancePopulated = await TEntrance.findOne(newEntrance.id)
          .populate('cave')
          .populate('country')
          .populate('descriptions')
          .usingConnection(db);

        return newEntrancePopulated;
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

    // Prepare data for Elasticsearch indexation
    const description =
      newEntrancePopulated.descriptions.length === 0
        ? null
        : // There is only one description at the moment
          newEntrancePopulated.descriptions[0].title +
          ' ' +
          newEntrancePopulated.descriptions[0].body;

    // Format cave massif
    newEntrancePopulated.cave.massif = {
      id: newEntrancePopulated.cave.massif,
    };
    await CaveService.setEntrances([newEntrancePopulated.cave]);
    await NameService.setNames([newEntrancePopulated], 'entrance');
    await NameService.setNames([newEntrancePopulated.cave], 'cave');
    await NameService.setNames([newEntrancePopulated.cave.massif], 'massif');

    const { cave, name, names, ...newEntranceESData } = newEntrancePopulated;
    try {
      esClient.create({
        index: `entrances-index`,
        type: 'data',
        id: newEntrancePopulated.id,
        body: {
          ...newEntranceESData,
          name: newEntrancePopulated.name,
          names: newEntrancePopulated.names.map((n) => n.name).join(', '),
          descriptions: [description],
          type: 'entrance',
          'cave name': newEntrancePopulated.cave.name,
          'cave length': newEntrancePopulated.cave.length,
          'cave depth': newEntrancePopulated.cave.depth,
          'cave is diving': newEntrancePopulated.cave.isDiving,
          'massif name': newEntrancePopulated.cave.massif.name,
          country: newEntrancePopulated.country.nativeName,
          'country code': newEntrancePopulated.country.iso3,
        },
      });
    } catch (error) {
      sails.log.error(error);
    }

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
      return res.forbidden('You are not authorized to update a entrance.');
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
};
