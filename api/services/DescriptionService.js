const ramda = require('ramda');

module.exports = {
  /**
   * @param {string} document to document to set names including its parent if present
   * @param {Boolean} [setParent=true] specify if the document parent description must be set
   *    (recursive and cost a lot of resources)
   */
  setDocumentDescriptions: async (document, setParent = true) => {
    if (document) {
      // eslint-disable-next-line no-param-reassign
      document.descriptions = await TDescription.find()
        .where({
          document: document.id,
        })
        .populate('language');
      if (setParent && ramda.pathOr(null, ['parent', 'id'], document)) {
        await module.exports.setDocumentDescriptions(document.parent);
      }
    }
  },

  setMassifDescriptions: async (massif) => {
    if (massif) {
      // eslint-disable-next-line no-param-reassign
      massif.descriptions = await TDescription.find()
        .where({ massif: massif.id })
        .populate('language');
    }
  },
};
