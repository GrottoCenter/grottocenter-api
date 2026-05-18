const CommonService = require('./CommonService');
const SearchService = require('./SearchService');
const NameService = require('./NameService');

module.exports = {
  isARealCaver: async (email) =>
    email && !email.toLowerCase().endsWith('@mail.no'),

  /**
   * Count the "real" users (@see REAL_USERS_QUERY)
   */
  countDistinctUsers: async () => {
    // Non-users caver like authors (and with the email ending with @mail.no) have no password set.
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

    await module.exports.updateInSearch(newCaver);

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
      .populate('exploredCaves')
      .populate('grottos')
      .populate('groups')
      .populate('subscribedToCountries')
      .populate('subscribedToMassifs')
      .populate('subscribedToRegions');

    if (!caver) return null;

    // Delete sensitive data
    delete caver.activationCode;
    delete caver.password;

    caver.type = (await module.exports.isARealCaver(caver.mail))
      ? 'CAVER'
      : 'AUTHOR';

    // Set entrances for explored caves
    // eslint-disable-next-line global-require
    const CaveService = require('./CaveService');
    await CaveService.setEntrances(caver.exploredCaves);

    await NameService.setNames([...caver.exploredCaves], 'cave');

    // Split caves between entrances and networks (cave)
    caver.exploredNetworks = [];
    caver.exploredEntrances = [];
    for (const cave of caver.exploredCaves) {
      if (cave.entrances.length > 1) {
        caver.exploredNetworks.push(cave);
      }
      if (cave.entrances.length === 1) {
        caver.exploredEntrances.push(cave.entrances.pop());
      }
    }

    await Promise.all([
      NameService.setNames(caver.exploredEntrances, 'entrance'),
      NameService.setNames(caver.grottos, 'grotto'),
      NameService.setNames(caver.subscribedToMassifs, 'massif'),
    ]);

    return {
      id: caver.id,
      type: caver.type,
      banned: caver.banned,
      name: caver.name,
      surname: caver.surname,
      nickname: caver.nickname,
      language: caver.language,
      groups: caver.groups,
      grottos: caver.grottos,
      exploredCaves: caver.exploredCaves,
      exploredEntrances: caver.exploredEntrances,
      exploredNetworks: caver.exploredNetworks,
      documents: caver.documents,
      subscribedToMassifs: caver.subscribedToMassifs,
      subscribedToCountries: caver.subscribedToCountries,
      subscribedToRegions: caver.subscribedToRegions,
    };
  },

  async deleteInSearch(caverId) {
    await SearchService.deleteDocument('persons', caverId);
  },

  async updateInSearch(caver) {
    await SearchService.updateDocument('persons', {
      id: caver.id,
      dateInscription: caver.dateInscription,
      mail: caver.mail,
      name: caver.name,
      surname: caver.surname,
      nickname: caver.nickname,
    });
  },
};
