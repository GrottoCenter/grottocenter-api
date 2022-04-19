module.exports = {
  /**
   *
   * @param {*} languageId
   * @returns language or undefined if languageId is not provided or not found
   */
  getLanguage: async (languageId) => {
    const language = languageId
      ? await TLanguage.findOne(languageId)
      : undefined;
    return language;
  },
};
