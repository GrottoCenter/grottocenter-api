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
};
