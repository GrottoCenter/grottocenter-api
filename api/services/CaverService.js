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
};
