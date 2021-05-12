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
};
