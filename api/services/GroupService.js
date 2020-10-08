module.exports = {
  /**
   * @param {String} groupId group to search for
   *
   * @returns {Boolean} true if the group exists in the DB, else false
   */
  checkIfExists: async (groupId) => {
    const groupFound = await TGroup.findOne({ id: groupId });
    return groupFound !== undefined;
  },
};
