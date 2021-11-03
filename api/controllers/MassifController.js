/**
 * MassifController
 *
 * @description :: Server-side logic for managing massif
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
const ramda = require('ramda');

module.exports = {
  find: (req, res, next, converter = MappingV1Service.convertToMassifModel) => {
    TMassif.findOne(req.params.id)
      .populate('author')
      .populate('caves')
      .populate('names')
      .populate('descriptions')
      .exec((err, found) => {
        const params = {};
        params.searchedItem = `Massif of id ${req.params.id}`;
        if (!found) {
          const notFoundMessage = `${params.searchedItem} not found`;
          sails.log.debug(notFoundMessage);
          return res.status(404).send(notFoundMessage);
        }
        CaveService.setEntrances(found.caves).then(
          (cavesEntrancesPopulated) => {
            NameService.setNames(cavesEntrancesPopulated, 'cave').then(
              (cavesPopulated) => {
                found.caves = cavesPopulated;
                return ControllerService.treatAndConvert(
                  req,
                  err,
                  found,
                  params,
                  res,
                  converter,
                );
              },
            );
          },
        );
      });
  },

  delete: async (req, res) => {
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.MASSIF,
        rightAction: RightService.RightActions.DELETE_ANY,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to delete a massif.',
        );
      });
    if (!hasRight) {
      return res.forbidden('You are not authorized to delete a massif.');
    }

    // Check if massif exists and if it's not already deleted
    const massifId = req.param('id');
    const currentMassif = await TMassif.findOne(massifId);
    if (currentMassif) {
      if (currentMassif.isDeleted) {
        return res.status(410).send({
          message: `The massif with id ${massifId} has already been deleted.`,
        });
      }
    } else {
      return res.status(404).send({
        message: `Massif of id ${massifId} not found.`,
      });
    }
    // Delete massif
    const updatedMassif = await TMassif.destroyOne({ id: massifId }).intercept(
      (err) => {
        return res.serverError(
          `An unexpected error occured when trying to delete massif with id ${massifId}.`,
        );
      },
    );
    return res.sendStatus(204);
  },

  create: async (req, res) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.MASSIF,
        rightAction: RightService.RightActions.CREATE,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to create a massif.',
        );
      });
    if (!hasRight) {
      return res.forbidden('You are not authorized to create a massif.');
    }

    // Check params
    if (req.param('name') === null) {
      return res.badRequest(`You must provide a name.`);
    }
    if (req.param('descriptionAndNameLanguage') === null) {
      return res.badRequest(
        `You must provide a description and name language.`,
      );
    }

    // Launch creation request using transaction: it performs a rollback if an error occurs
    try {
      const newMassifPopulated = await sails
        .getDatastore()
        .transaction(async (db) => {
          const cleanedData = {
            author: req.token.id,
            caves: req.body.caves ? req.body.caves.map((c) => c.id) : [],
            dateInscription: new Date(),
          };

          const newMassif = await TMassif.create(cleanedData)
            .fetch()
            .usingConnection(db);

          // Name
          await TName.create({
            author: req.token.id,
            dateInscription: new Date(),
            isMain: true,
            language: req.body.descriptionAndNameLanguage.id,
            massif: newMassif.id,
            name: req.body.name,
          })
            .fetch()
            .usingConnection(db);

          // Description (if provided)
          if (ramda.propOr(null, 'description', req.body)) {
            await TDescription.create({
              author: req.token.id,
              body: req.body.description,
              dateInscription: new Date(),
              massif: newMassif.id,
              language: req.body.descriptionAndNameLanguage.id,
              title: req.body.descriptionTitle,
            }).usingConnection(db);
          }

          // Prepare data for Elasticsearch indexation
          const newMassifPopulated = await TMassif.findOne(newMassif.id)
            .populate('caves')
            .populate('descriptions')
            .populate('names')
            .usingConnection(db);

          // Prepare data for Elasticsearch indexation
          const description =
            newMassifPopulated.descriptions.length === 0
              ? null
              : // There is only one description at the moment
                newMassifPopulated.descriptions[0].title +
                ' ' +
                newMassifPopulated.descriptions[0].body;

          await CaveService.setEntrances(newMassifPopulated.caves);

          // Format data
          const { cave, name, names, ...newMassifESData } = newMassifPopulated;
          await ElasticsearchService.create('massifs', newMassifPopulated.id, {
            ...newMassifESData,
            name: newMassifPopulated.names[0].name, // There is only one name at the creation time
            names: newMassifPopulated.names.map((n) => n.name).join(', '),
            'nb caves': newMassifPopulated.caves.length,
            'nb entrances': newMassifPopulated.caves.reduce(
              (total, cave) => total + cave.entrances.length,
              0,
            ),
            descriptions: [description],
            tags: ['massif'],
          });

          const params = {};
          params.controllerMethod = 'MassifController.create';
          return ControllerService.treat(
            req,
            null,
            newMassifPopulated,
            params,
            res,
          );
        });
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
    }
  },
};
