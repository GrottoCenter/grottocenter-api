const CommonService = require('./CommonService');
const NameService = require('./NameService');

module.exports = {
  isARealCaver: (email) =>
    Boolean(email) && !email.toLowerCase().endsWith('@mail.no'),

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
      // `authoredCount` below carries the real total. Deleted documents are
      // filtered in the query rather than afterwards, so they cannot consume
      // one of the slots.
      .populate('documents', {
        where: { isDeleted: false },
        limit: 10,
        sort: [{ dateInscription: 'DESC' }],
      })
      .populate('exploredEntrances')
      .populate('grottos')
      .populate('groups')
      .populate('subscribedToCountries')
      .populate('subscribedToMassifs')
      .populate('subscribedToRegions');

    if (!caver) return null;

    // Delete sensitive data
    delete caver.activationCode;
    delete caver.password;

    caver.type = module.exports.isARealCaver(caver.mail) ? 'CAVER' : 'AUTHOR';

    // Required here rather than at the top of the file: DocumentService pulls in
    // utils/csvHelper, which requires this service back, so a top-level capture
    // would resolve to a half-initialised module.
    // eslint-disable-next-line global-require
    const DocumentService = require('./DocumentService');

    const [authoredCount] = await Promise.all([
      DocumentService.countAuthoredByCaver(caverId),
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
      customMessage: caver.customMessage,
      avatarPath: caver.avatarPath,
      groups: caver.groups,
      grottos: caver.grottos,
      exploredEntrances: caver.exploredEntrances,
      documents: caver.documents,
      authoredCount,
      subscribedToMassifs: caver.subscribedToMassifs,
      subscribedToCountries: caver.subscribedToCountries,
      subscribedToRegions: caver.subscribedToRegions,
    };
  },

  /**
   * @param {number} targetId id of the caver receiving the links
   * @param {string} key name of a TCaver collection (e.g. 'documents')
   * @param {Array} ids ids of the records to link to the target
   * @description Link records to a caver, skipping links that already exist.
   * The target's links are read just before the insert, and a link created
   * meanwhile by a concurrent request (double-submitted merge) is ignored
   * rather than surfacing as E_UNIQUE.
   * @throws {Error} with code E_NOT_FOUND when the target no longer exists
   * (deleted or merged by a concurrent request), so the caller keeps the
   * source's links instead of clearing them.
   * @returns {Promise<void>}
   */
  mergeCollection: async (targetId, key, ids) => {
    if (!ids || ids.length === 0) return;
    const target = await TCaver.findOne(targetId).populate(key);
    if (!target) {
      const error = new Error(
        `Merge target caver of id ${targetId} not found.`
      );
      error.code = 'E_NOT_FOUND';
      throw error;
    }
    const existingIds = new Set(target[key].map((e) => e.id));
    const idsToAdd = [...new Set(ids)].filter((id) => !existingIds.has(id));
    if (idsToAdd.length === 0) return;

    try {
      await TCaver.addToCollection(targetId, key, idsToAdd);
    } catch (error) {
      if (error.code !== 'E_UNIQUE') throw error;
      // Another request linked some of these records in the meantime: add
      // them one by one so the missing ones still get linked.
      sails.log.warn(
        `Caver ${targetId} merge: ${key} links already present, retrying one by one (${idsToAdd.join(', ')})`
      );
      for (const id of idsToAdd) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await TCaver.addToCollection(targetId, key, [id]);
        } catch (innerError) {
          if (innerError.code !== 'E_UNIQUE') throw innerError;
        }
      }
    }
  },
};
