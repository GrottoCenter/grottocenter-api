const ramda = require('ramda');

module.exports = {
  /**
   * @param {string} document to document to set names including its parent if present
   */
  setDocumentDescriptions: async (document) => {
    document.descriptions = await TDescription.find().where({
      document: document.id,
    });
    if (ramda.pathOr(null, ['parent', 'id'], document)) {
      await module.exports.setDocumentDescriptions(document.parent);
    }
  },
};
