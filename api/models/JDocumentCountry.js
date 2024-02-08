/**
 * JDocumentSubject.js
 *
 * @description :: jDocumentSubject model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_document_country',

  attributes: {
    document: {
      columnName: 'id_document',
      model: 'TDocument',
    },

    country: {
      columnName: 'id_country',
      model: 'TCountry',
    },
  },
};
