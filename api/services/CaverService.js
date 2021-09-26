const ramda = require('ramda');

// Substract 1 to not count the no@mail.no mail used for the non-user cavers
const DISTINCT_USERS_QUERY = 'SELECT count(DISTINCT mail) - 1 FROM t_caver';

module.exports = {
  /**
   * @param {int} caverId
   * @description Return the groups of the caver without checking if the caver exists.
   * @returns {Array[TGroup]}
   */
  getGroups: async (caverId) => {
    const caver = await TCaver.findOne(caverId).populate('groups');
    return caver.groups;
  },

  countDistinctUsers: async () => {
    const result = await CommonService.query(DISTINCT_USERS_QUERY);
    return Number(result.rows[0]['?column?']);
  },

  createNonUserCaver: async (caverData, errorHandler, esClient) => {
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
      name: name,
      nickname: nickname,
      surname: surname,
      language: '000', // default null language id
    })
      .fetch()
      .intercept(errorHandler);

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
    return newCaver;
  },

  /**
   * @param {Integer} caverId
   * @param {Object} req
   * @param {Function} ormErrorHandler callback that is called whenever an error occured. Take an Error as parameter. See https://sailsjs.com/documentation/concepts/models-and-orm/errors for more information.
   * @description Get a caver by his id and populate it according to the user rights (using req).
   * @returns {Object}
   */
  getCaver: async (
    caverId,
    req,
    ormErrorHandler = ErrorService.getDefaultOrmErrorHandler(),
  ) => {
    const caver = await TCaver.findOne(caverId)
      .populate('documents')
      .populate('grottos')
      .populate('groups')
      .intercept(ormErrorHandler);

    if (!caver) return caver; // not found return

    // Check complete view right
    const hasCompleteViewRight = req.token
      ? await sails.helpers.checkRight
          .with({
            groups: req.token.groups,
            rightEntity: RightService.RightEntities.CAVER,
            rightAction: RightService.RightActions.VIEW_COMPLETE,
          })
          .tolerate('rightNotFound', (error) => {
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
    } else {
      return {
        documents: caver.documents,
        name: caver.name,
        nickname: caver.nickname,
        surname: caver.surname,
      };
    }
  },
};
