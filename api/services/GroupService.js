module.exports = {
  /**
   * @param {String} attributeName group attribute to search for
   * @param {String} attributeValue value to search for
   *
   * @returns {Boolean} true if there is a group with the attributeName equals to attributeValue in the DB, else false.
   *
   * @example checkIfExists('id', 3) will return true if there is at least one group with id 3.
   */
  checkIfExists: async (attributeName, attributeValue) => {
    const groupFound = await TGroup.findOne({
      [attributeName]: attributeValue,
    });
    return groupFound !== undefined;
  },
};
