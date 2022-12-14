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

  getIdDescriptionsByEntranceId: async (
    entranceId,
    { includeDeleted = false } = {}
  ) => {
    if (!entranceId) return [];
    return TDescription.find({
      where: { entrance: entranceId, isDeleted: includeDeleted },
      select: ['id'],
    });
  },

  getHDescriptionsById: async (descriptionId) =>
    HDescription.find({ t_id: descriptionId })
      .populate('reviewer')
      .populate('author'),

  getDescription: async (descriptionId, { includeDeleted = false } = {}) =>
    TDescription.findOne({
      id: descriptionId,
      isDeleted: includeDeleted,
    })
      .populate('author')
      .populate('reviewer'),

  getHDescriptionsOfDocument: async (documentId) => {
    const hDescriptions = await HDescription.find()
      .where({
        document: documentId,
      })
      .sort('id DESC')
      .populate('author')
      .populate('language')
      .populate('reviewer');
    const tDescription = await TDescription.find()
      .where({
        document: documentId,
      })
      .populate('author')
      .populate('language')
      .populate('reviewer');
    if (tDescription.length > 0) {
      // Transform TDescritpion object to keep same model as HDescription
      tDescription[0].t_id = tDescription[0].id;
      tDescription[0].id = tDescription[0].dateReviewed;
      hDescriptions.push(tDescription[0]);
    }
    return hDescriptions;
  },

  compareDescriptionDate(documentDate, newDescDate, oldDescDate) {
    newDescDate.setMinutes(newDescDate.getMinutes() - 2);
    if (documentDate.getTime() >= newDescDate.getTime()) {
      if (newDescDate.getTime() > oldDescDate.getTime()) {
        return true;
      }
    }
    return false;
  },
};
