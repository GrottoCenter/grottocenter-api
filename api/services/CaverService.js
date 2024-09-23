const CommonService = require('./CommonService');
const ElasticsearchService = require('./ElasticsearchService');
const NameService = require('./NameService');

module.exports = {
  isARealCaver: async (email) =>
    email && !email.toLowerCase().endsWith('@mail.no'),

  /**
   * Count the "real" users (@see REAL_USERS_QUERY)
   */
  countDistinctUsers: async () => {
    // Non-users caver (like authors) have no password set.
    const REAL_USERS_QUERY = 'SELECT count(password) FROM t_caver';
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
    let nickname = caverData?.nickname ?? '';
    const name = caverData?.name ?? undefined;
    const surname = caverData?.surname ?? undefined;
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
      deleted: false,
      tags: ['caver'],
    }).catch(() => {});

    return newCaver;
  },

  /**
   * @param {Integer} caverId
   * @throws Sails ORM errors (see https://sailsjs.com/documentation/concepts/models-and-orm/errors)
   * @description Get a caver by his id and populate it according to the user rights (using req).
   * @returns {Object}
   */
  getCaver: async (caverId) => {
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

    if (!caver) return null;

    // Delete sensitive data
    delete caver.activationCode;
    delete caver.password;

    caver.type = module.exports.isARealCaver(caver.mail) ? 'CAVER' : 'AUTHOR';

    caver.exploredEntrances = caver.exploredEntrances.filter(
      (entrance) => entrance.isPublic
    );

    const asyncArr = [
      NameService.setNames(caver.exploredEntrances, 'entrance'),
      NameService.setNames(caver.grottos, 'grotto'),
      NameService.setNames(caver.subscribedToMassifs, 'massif'),
    ];

    await Promise.all(asyncArr);

    return {
      id: caver.id,
      type: caver.type,
      name: caver.name,
      surname: caver.surname,
      nickname: caver.nickname,
      language: caver.language,
      groups: caver.groups,
      grottos: caver.grottos,
      exploredEntrances: caver.exploredEntrances,
      documents: caver.documents,
      subscribedToMassifs: caver.subscribedToMassifs,
      subscribedToCountries: caver.subscribedToCountries,
    };
  },
};
