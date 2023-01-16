const ramda = require('ramda');
// Non-users caver (like authors) have no password set.
const REAL_USERS_QUERY = 'SELECT count(password) FROM t_caver';

const CommonService = require('./CommonService');
const ElasticsearchService = require('./ElasticsearchService');
const RightService = require('./RightService');

module.exports = {
  /**
   * Return the groups of the caver without checking if the caver exists.
   * @param {int} caverId
   * @throws Sails ORM errors (see https://sailsjs.com/documentation/concepts/models-and-orm/errors)
   * @returns {Array[TGroup]}
   */
  getGroups: async (caverId) => {
    const caver = await TCaver.findOne(caverId).populate('groups');
    return caver.groups;
  },

  /**
   * Count the "real" users (@see REAL_USERS_QUERY)
   */
  countDistinctUsers: async () => {
    const result = await CommonService.query(REAL_USERS_QUERY);
    return Number(result.rows[0].count);
  },

  /**
   * @param {Object} caverData
   * @param {string} caverData.nickname
   * @param {string} [caverData.name]
   * @param {string} [caverData.surname]
   * @throws Sails ORM errors (see https://sailsjs.com/documentation/concepts/models-and-orm/errors)
   * @returns {TCaver} the created caver
   */
  createNonUserCaver: async (caverData) => {
    let nickname = ramda.propOr('', 'nickname', caverData);
    const name = ramda.propOr(undefined, 'name', caverData);
    const surname = ramda.propOr(undefined, 'surname', caverData);
    if (nickname === '') {
      if (name) {
        nickname += name;
      }
      if (surname) {
        const space = name ? ' ' : '';
        nickname += space + surname;
      }
    }

    const newCaver = await TCaver.create({
      dateInscription: new Date(),
      mail: `${+new Date()}@mail.no`, // default mail for non-user caver
      mailIsValid: false,
      name,
      nickname,
      surname,
      language: '000', // default null language id
    }).fetch();

    await ElasticsearchService.create('cavers', newCaver.id, {
      id: newCaver.id,
      groups: '',
      mail: newCaver.mail,
      name: newCaver.name,
      nickname: newCaver.nickname,
      surname: newCaver.surname,
      tags: ['caver'],
    });

    return newCaver;
  },

  /**
   * @param {Integer} caverId
   * @param {Object} req
   * @throws Sails ORM errors (see https://sailsjs.com/documentation/concepts/models-and-orm/errors)
   * @description Get a caver by his id and populate it according to the user rights (using req).
   * @returns {Object}
   */
  getCaver: async (caverId, req) => {
    const caver = await TCaver.findOne(caverId)
      .populate('documents', {
        limit: 10,
        sort: [{ dateInscription: 'DESC' }],
      })
      .populate('exploredEntrances', {
        limit: 10,
        sort: [{ dateInscription: 'DESC' }],
      })
      .populate('grottos')
      .populate('groups')
      .populate('subscribedToCountries')
      .populate('subscribedToMassifs');

    if (!caver) return caver; // not found return

    // Check complete view right
    const hasCompleteViewRight = req.token
      ? await sails.helpers.checkRight
          .with({
            groups: req.token.groups,
            rightEntity: RightService.RightEntities.CAVER,
            rightAction: RightService.RightActions.VIEW_COMPLETE,
          })
          .tolerate('rightNotFound', () => {
            // Silently fail
            sails.log.warn('Right Caver - view complete not found');
            return false;
          })
      : false;

    // Delete sensitive data
    delete caver.activationCode;
    delete caver.password;
    caver.exploredEntrances = caver.exploredEntrances.filter(
      (entrance) => entrance.isPublic
    );

    if (req.token && Number(caverId) === req.token.id) {
      return caver;
    }

    if (hasCompleteViewRight) {
      return caver;
    }

    return {
      id: caver.id,
      documents: caver.documents,
      exploredEntrances: caver.exploredEntrances,
      groups: caver.groups,
      language: caver.language,
      name: caver.name,
      nickname: caver.nickname,
      grottos: caver.grottos,
      surname: caver.surname,
      subscribedToMassifs: caver.subscribedToMassifs,
      subscribedToCountries: caver.subscribedToCountries,
    };
  },
  /**
   * @param {Integer} caverId
   * @throws Sails ORM errors (see https://sailsjs.com/documentation/concepts/models-and-orm/errors)
   * @description Check if a caver is an author by looking at his email. If caver not found return false.
   * @returns {Boolean}
   */
  isAuthor: async (caverId) => {
    const caver = await TCaver.findOne(caverId);

    if (caver && caver.mail && caver.mail.endsWith('@mail.no')) {
      if (caver.mail.endsWith('@mail.no')) return true;
    }

    return false;
  },
};
