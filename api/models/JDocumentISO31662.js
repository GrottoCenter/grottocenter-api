/**
 * JDocumentSubject.js
 *
 * @description :: jDocumentSubject model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_document_iso3166_2',

  attributes: {
    document: {
      columnName: 'id_document',
      model: 'TDocument',
    },

    iso: {
      columnName: 'id_iso',
      model: 'TISO31662',
    },
  },
};
