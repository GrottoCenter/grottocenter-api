/**
 * JGuidelineRegion.js
 *
 * @description :: Join model for guidelines and regions.
 */

module.exports = {
  tableName: 'j_guideline_region',

  attributes: {
    guideline: {
      columnName: 'id_guideline',
      model: 'TGuideline',
    },

    region: {
      columnName: 'id_region',
      model: 'TISO31662',
    },
  },
};
