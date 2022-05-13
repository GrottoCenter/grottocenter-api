/**
 * JDocumentMassif.js
 *
 * @description :: jDocumentMassif model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_document_massif',

  attributes: {
    document: {
      columnName: 'id_document',
      model: 'TDocument',
    },

    massif: {
      columnName: 'id_massif',
      model: 'TMassif',
    },
  },
};
