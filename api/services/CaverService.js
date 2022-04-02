const ramda = require('ramda');

// Substract 1 to not count the no@mail.no mail used for the non-user cavers
const DISTINCT_USERS_QUERY = 'SELECT count(DISTINCT mail) - 1 FROM t_caver';

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
   * Count the "real" users by using the mail attribute
   */
  countDistinctUsers: async () => {
    const result = await CommonService.query(DISTINCT_USERS_QUERY);
    return Number(result.rows[0]['?column?']);
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
      mail: 'no@mail.no', // default mail for non-user caver
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
      .populate('documents')
      .populate('grottos')
      .populate('groups');

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

    if (hasCompleteViewRight) {
      return caver;
    }
    return {
      id: caver.id,
      documents: caver.documents,
      name: caver.name,
      nickname: caver.nickname,
      surname: caver.surname,
    };
  },
};
