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
   * @param {String} attributeName caver attribute to search for
   * @param {String} attributeValue value to search for
   *
   * @returns {Boolean} true if there is a caver with the attributeName equals to attributeValue in the DB, else false.
   *
   * @example checkIfExists('nickname', 'Alice Bob') will return true if there is at least one user with nickname 'Alice Bob'
   */
  checkIfExists: async (attributeName, attributeValue) => {
    const caverFound = await TCaver.findOne({
      [attributeName]: attributeValue,
    });
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
