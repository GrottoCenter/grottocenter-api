/**
 * JGuidelineCountry.js
 *
 * @description :: Join model for guidelines and countries.
 */

module.exports = {
  tableName: 'j_guideline_country',

  attributes: {
    guideline: {
      columnName: 'id_guideline',
      model: 'TGuideline',
    },

    country: {
      columnName: 'id_country',
      model: 'TCountry',
    },
  },
};
