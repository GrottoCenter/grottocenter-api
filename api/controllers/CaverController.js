/**
 * CaverController
 *
 * @description :: Server-side logic for managing cavers
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

const esClient = require('../../config/elasticsearch').elasticsearchCli;

module.exports = {
  find: async (req, res, next, converter) => {
    const caverId = req.param('id');

    TCaver.findOne(caverId)
      .populate('documents')
      .populate('grottos')
      .populate('groups')
      .then(async (caverFound) => {
        const params = {};
        params.searchedItem = `Caver of id ${caverId}`;
        if (!caverFound) {
          const notFoundMessage = `${params.searchedItem} not found`;
          sails.log.debug(notFoundMessage);
          res.status(404);
          return res.json({ error: notFoundMessage });
        }

        // Check complete view right
        const hasCompleteViewRight = req.token
          ? await sails.helpers.checkRight
              .with({
                groups: req.token.groups,
                rightEntity: RightService.RightEntities.CAVER,
                rightAction: RightService.RightActions.VIEW_COMPLETE,
              })
              .intercept('rightNotFound', (err) => {
                return res.serverError(
                  'A server error occured when checking your right to entirely view a caver.',
                );
              })
          : false;

        // Delete sensitive data
        delete caverFound.activationCode;
        delete caverFound.password;

        return ControllerService.treatAndConvert(
          req,
          null,
          hasCompleteViewRight
            ? caverFound
            : {
                documents: caverFound.documents,
                name: caverFound.name,
                nickname: caverFound.nickname,
                surname: caverFound.surname,
              },
          params,
          res,
          converter,
        );
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

  findAll: (req, res) => {
    const parameters = {};
    if (req.param('name') !== undefined) {
      parameters.name = {
        like: `%${req.param('name')}%`,
      };
      sails.log.debug(`parameters ${parameters.name.like}`);
    }

    TCaver.find(parameters)
      .sort('id ASC')
      .limit(10)
      .exec((err, found) => {
        const params = {};
        params.controllerMethod = 'CaverController.findAll';
        params.notFoundMessage = 'No cavers found.';
        return ControllerService.treat(req, err, found, params, res);
      });
  },

  count: (req, res) => {
    TCaver.count().exec((err, found) => {
      const params = {};
      params.controllerMethod = 'CaverController.count';
      params.notFoundMessage = 'Problem while getting number of cavers.';

      const count = {};
      count.count = found;
      return ControllerService.treat(req, err, count, params, res);
    });
  },

  putOnGroup: async (req, res) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.CAVER,
        rightAction: RightService.RightActions.EDIT_ANY,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to add a caver to a group.',
        );
      });
    if (!hasRight) {
      return res.forbidden('You are not authorized to add a caver to a group.');
    }

    // Check params
    if (!(await CaverService.checkIfExists('id', req.param('caverId')))) {
      return res.badRequest(
        `Could not find caver with id ${req.param('caverId')}.`,
      );
    }
    if (!(await GroupService.checkIfExists('id', req.param('groupId')))) {
      return res.badRequest(
        `Could not find group with id ${req.param('groupId')}.`,
      );
    }

    // Update caver
    TCaver.addToCollection(req.param('caverId'), 'groups', req.param('groupId'))
      .then(() => {
        const params = {};
        params.controllerMethod = 'CaverController.putOnGroup';
        return ControllerService.treat(req, null, {}, params, res);
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

  removeFromGroup: async (req, res) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.CAVER,
        rightAction: RightService.RightActions.EDIT_ANY,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to remove a caver from a group.',
        );
      });
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to remove a caver from a group.',
      );
    }

    // Check params
    if (!(await CaverService.checkIfExists('id', req.param('caverId')))) {
      return res.badRequest(
        `Could not found caver with id ${req.param('caverId')}.`,
      );
    }
    if (!(await GroupService.checkIfExists('id', req.param('groupId')))) {
      return res.badRequest(
        `Could not found group with id ${req.param('groupId')}.`,
      );
    }

    // Update caver
    TCaver.removeFromCollection(
      req.param('caverId'),
      'groups',
      req.param('groupId'),
    )
      .then(() => {
        const params = {};
        params.controllerMethod = 'CaverController.removeFromGroup';
        return ControllerService.treat(req, null, {}, params, res);
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

  setGroups: async (req, res) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.CAVER,
        rightAction: RightService.RightActions.EDIT_ANY,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to set caver groups.',
        );
      });
    if (!hasRight) {
      return res.forbidden('You are not authorized to set caver groups.');
    }

    // Check params
    if (!(await CaverService.checkIfExists('id', req.param('caverId')))) {
      return res.badRequest(
        `Could not find caver with id ${req.param('caverId')}.`,
      );
    }

    const newGroups = req.param('groups');
    newGroups.map(async (g) => {
      if (!(await GroupService.checkIfExists('id', g.id))) {
        return res.badRequest(`Could not find group with id ${g.id}.`);
      }
    });

    // Update caver
    TCaver.replaceCollection(
      req.param('caverId'),
      'groups',
      newGroups.map((g) => g.id),
    )
      .then(() => {
        esClient.update({
          index: `cavers-index`,
          type: 'data',
          id: req.param('caverId'),
          body: {
            doc: {
              groups: newGroups.map((g) => g.id).join(','),
            },
          },
        });

        const params = {};
        params.controllerMethod = 'CaverController.setGroups';
        return ControllerService.treat(req, null, {}, params, res);
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

  getAdmins: async (
    req,
    res,
    next,
    converter = MappingV1Service.convertToCaverList,
  ) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.CAVER,
        rightAction: RightService.RightActions.VIEW_ANY,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to view admins.',
        );
      });
    if (!hasRight) {
      return res.forbidden('You are not authorized to view admins.');
    }

    // Get Admins
    const adminGroup = await TGroup.find({
      name: 'Administrator',
    }).populate('cavers');
    if (!adminGroup) {
      return res.status(404).send({ message: 'No administrators found.' });
    }
    const params = {};
    const admins = adminGroup[0].cavers;
    const adminsWithGroups = await Promise.all(
      admins.map(async (caver) => ({
        ...caver,
        groups: await CaverService.getGroups(caver.id),
      })),
    );
    params.controllerMethod = 'CaverController.getAdmins';
    return ControllerService.treatAndConvert(
      req,
      null,
      adminsWithGroups,
      params,
      res,
      converter,
    );
  },

  getModerators: async (
    req,
    res,
    next,
    converter = MappingV1Service.convertToCaverList,
  ) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.CAVER,
        rightAction: RightService.RightActions.VIEW_ANY,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to view moderators.',
        );
      });
    if (!hasRight) {
      return res.forbidden('You are not authorized to view moderators.');
    }

    // Get Moderators
    const moderatorGroup = await TGroup.find({
      name: 'Moderator',
    }).populate('cavers');
    if (!moderatorGroup) {
      return res.status(404).send({ message: 'No moderators found.' });
    }
    const params = {};
    const moderators = moderatorGroup[0].cavers;
    const moderatorsWithGroups = await Promise.all(
      moderators.map(async (caver) => ({
        ...caver,
        groups: await CaverService.getGroups(caver.id),
      })),
    );
    params.controllerMethod = 'CaverController.getModerators';
    return ControllerService.treatAndConvert(
      req,
      null,
      moderatorsWithGroups,
      params,
      res,
      converter,
    );
  },

  create: async (
    req,
    res,
    next,
    converter = MappingV1Service.convertToCaverModel,
  ) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.CAVER,
        rightAction: RightService.RightActions.CREATE,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to create a caver.',
        );
      });
    if (!hasRight) {
      return res.forbidden('You are not authorized to create a caver.');
    }

    // Check params
    if (!req.param('name')) {
      return res.badRequest(`You must provide a name to create a new caver.`);
    }
    if (!req.param('surname')) {
      return res.badRequest(
        `You must provide a surname to create a new caver.`,
      );
    }

    const newCaver = await TCaver.create({
      dateInscription: new Date(),
      mail: 'no@mail.no', // default mail for non-user caver
      name: req.param('name'),
      nickname: `${req.param('name')} ${req.param('surname')}`,
      surname: req.param('surname'),
      language: '000', // default null language id
    })
      .fetch()
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

    try {
      esClient.create({
        index: `cavers-index`,
        type: 'data',
        id: newCaver.id,
        body: {
          id: newCaver.id,
          groups: '',
          mail: newCaver.mail,
          name: newCaver.name,
          nickname: newCaver.nickname,
          surname: newCaver.surname,
          type: 'caver',
        },
      });
    } catch (error) {
      sails.log.error(error);
    }

    const params = {};
    params.controllerMethod = 'CaverController.create';
    return ControllerService.treatAndConvert(
      req,
      null,
      newCaver,
      params,
      res,
      converter,
    );
  },

  addExploredEntrance: async (req, res) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.CAVER,
        rightAction: RightService.RightActions.EDIT_OWN,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to mark an entrance as explored.',
        );
      });
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to mark an entrance as explored.',
      );
    }

    // Check params
    const caverId = req.param('caverId');
    const entranceId = req.param('entranceId');
    if (!(await CaverService.checkIfExists('id', caverId))) {
      return res.badRequest(`Could not find caver with id ${caverId}.`);
    }
    if (!(await EntranceService.checkIfExists('id', entranceId))) {
      return res.badRequest(`Could not find entrance with id ${entranceId}.`);
    }
    if (Number(caverId) !== req.token.id) {
      return res.forbidden(
        'You can not mark an entrance as explored to another account than yours.',
      );
    }

    // Update caver
    TCaver.addToCollection(caverId, 'exploredEntrances', entranceId)
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

  removeExploredEntrance: async (req, res) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.CAVER,
        rightAction: RightService.RightActions.EDIT_OWN,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to unmark an entrance as explored.',
        );
      });
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to unmark an entrance as explored.',
      );
    }

    // Check params
    const caverId = req.param('caverId');
    const entranceId = req.param('entranceId');
    if (!(await CaverService.checkIfExists('id', caverId))) {
      return res.badRequest(`Could not find caver with id ${caverId}.`);
    }
    if (!(await EntranceService.checkIfExists('id', entranceId))) {
      return res.badRequest(`Could not find entrance with id ${entranceId}.`);
    }
    if (Number(caverId) !== req.token.id) {
      return res.forbidden(
        'You can not unmark an entrance as explored to another account than yours.',
      );
    }

    // Update caver
    TCaver.removeFromCollection(caverId, 'exploredEntrances', entranceId)
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
