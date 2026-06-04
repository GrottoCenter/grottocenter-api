/**
 * JGuidelineMassif.js
 *
 * @description :: Join model for guidelines and massifs.
 */

module.exports = {
  tableName: 'j_guideline_massif',

  attributes: {
    guideline: {
      columnName: 'id_guideline',
      model: 'TGuideline',
    },

    massif: {
      columnName: 'id_massif',
      model: 'TMassif',
    },
  },
};
