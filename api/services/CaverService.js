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

  /**
   * @param {int} caverId
   * @description Return the groups of the caver without checking if the caver exists.
   * @returns {Array[TGroup]}
   */
  getGroups: async (caverId) => {
    const caver = await TCaver.findOne(caverId).populate('groups');
    return caver.groups;
  },
};
