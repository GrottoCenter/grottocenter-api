const GET_ADMINS_QUERY = `
  SELECT c.*
  FROM t_caver c
  LEFT JOIN j_caver_group jcg ON jcg.id_caver = c.id
  LEFT JOIN t_group g ON g.id = jcg.id_group
  WHERE g.name = 'Administrator'
`;

const GET_MODERATORS_QUERY = `
  SELECT c.*
  FROM t_caver c
  LEFT JOIN j_caver_group jcg ON jcg.id_caver = c.id
  LEFT JOIN t_group g ON g.id = jcg.id_group
  WHERE g.name = 'Moderator'
`;

module.exports = {
  /**
   * @param {String} caverId caver to search for
   *
   * @returns {Boolean} true if the caver exists in the DB, else false
   */
  checkIfExists: async (caverId) => {
    const caverFound = await TCaver.findOne({ id: caverId });
    return caverFound !== undefined;
  },

  getAdmins: async () => {
    const result = await CommonService.query(GET_ADMINS_QUERY, []);
    return result.rows;
  },

  getModerators: async () => {
    const result = await CommonService.query(GET_MODERATORS_QUERY, []);
    return result.rows;
  },
};
