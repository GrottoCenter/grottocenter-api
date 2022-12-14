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

  getMassifDescriptions: async (massifId, { includeDeleted = false } = {}) => {
    const descriptions = await TDescription.find()
      .where({ massif: massifId, isDeleted: includeDeleted })
      .populate('author')
      .populate('reviewer');
    return descriptions;
  },
  getCaveDescriptions: async (caveId, { includeDeleted = false } = {}) => {
    let descriptions = [];
    if (caveId) {
      descriptions = await TDescription.find()
        .where({ cave: caveId, isDeleted: includeDeleted })
        .populate('author')
        .populate('reviewer');
    }
    return descriptions;
  },
  getEntranceDescriptions: async (
    entranceId,
    { includeDeleted = false } = {}
  ) => {
    if (!entranceId) return [];
    return TDescription.find()
      .where({ entrance: entranceId, isDeleted: includeDeleted })
      .populate('author')
      .populate('reviewer');
  },

  getDescription: async (descriptionId, { includeDeleted = false } = {}) =>
    TDescription.findOne({
      id: descriptionId,
      isDeleted: includeDeleted,
    })
      .populate('author')
      .populate('reviewer'),
};
