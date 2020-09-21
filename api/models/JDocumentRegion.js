/**
 * JDocumentRegion.js
 *
 * @description :: jDocumentRegion model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_document_region',

  attributes: {
    document: {
      columnName: 'id_document',
      model: 'TDocument',
    },

    region: {
      columnName: 'id_region',
      model: 'TRegion',
    },
  },
};
