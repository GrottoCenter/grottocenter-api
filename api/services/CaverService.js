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
};
