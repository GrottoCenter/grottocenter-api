/**
 * CaverController
 *
 * @description :: Server-side logic for managing cavers
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

const esClient = require('../../config/elasticsearch').elasticsearchCli;

module.exports = {
  find: (req, res) => {
    TCaver.findOneById(req.params.id).exec((err, found) => {
      const params = {};
      params.controllerMethod = 'CaverController.find';
      params.notFoundMessage = `Caver of id ${req.params.id} not found.`;
      return ControllerService.treat(req, err, found, params, res);
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
        rightAction: RightService.RightActions.EDIT_ALL,
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
        `Could not found caver with id ${req.param('caverId')}.`,
      );
    }
    if (!(await GroupService.checkIfExists('id', req.param('groupId')))) {
      return res.badRequest(
        `Could not found group with id ${req.param('groupId')}.`,
      );
    }

    // Update caver
    TCaver.addToCollection(req.param('caverId'), 'groups', req.param('groupId'))
      .then(() => {
        const params = {};
        params.controllerMethod = 'CaverController.addToGroup';
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
        rightAction: RightService.RightActions.EDIT_ALL,
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
        rightAction: RightService.RightActions.EDIT_ALL,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to set a caver groups.',
        );
      });
    if (!hasRight) {
      return res.forbidden('You are not authorized to set a caver groups.');
    }

    // Check params
    if (!(await CaverService.checkIfExists('id', req.param('caverId')))) {
      return res.badRequest(
        `Could not found caver with id ${req.param('caverId')}.`,
      );
    }

    const newGroups = req.param('groups');
    newGroups.map(async (g) => {
      if (!(await GroupService.checkIfExists('id', g.id))) {
        return res.badRequest(`Could not found group with id ${g.id}.`);
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
        params.controllerMethod = 'CaverController.addToGroup';
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
        rightAction: RightService.RightActions.VIEW_ALL,
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
    CaverService.getAdmins()
      .then((found) => {
        const params = {};
        params.controllerMethod = 'CaverController.getAdmins';
        return ControllerService.treatAndConvert(
          req,
          null,
          found,
          params,
          res,
          converter,
        );
      })
      .catch((err) => {
        return res.serverError(err.cause.message);
      });
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
        rightAction: RightService.RightActions.VIEW_ALL,
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
    CaverService.getModerators()
      .then((found) => {
        const params = {};
        params.controllerMethod = 'CaverController.getModerators';
        return ControllerService.treatAndConvert(
          req,
          null,
          found,
          params,
          res,
          converter,
        );
      })
      .catch((err) => {
        return res.serverError(err.cause.message);
      });
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
        rightAction: RightService.RightActions.EDIT_ALL,
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

    // Launch creation request using transaction: it performs a rollback if an error occurs
    const newCaver = await TCaver.create({
      dateInscription: new Date(),
      mail: 'no@mail.no', // default mail for non-user caver
      name: req.param('name'),
      nickname: `${req.param('name')} ${req.param('surname')}`,
      surname: req.param('surname'),
      language: '000', // default null language id
    })
      .fetch()
      .intercept('E_UNIQUE', () => res.sendStatus(409))
      .intercept('UsageError', (e) => res.badRequest(e.cause.message))
      .intercept('AdapterError', (e) => res.badRequest(e.cause.message))
      .intercept((e) => res.serverError(e.message));

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
};
