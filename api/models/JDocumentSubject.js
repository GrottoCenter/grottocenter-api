/**
 * JDocumentSubject.js
 *
 * @description :: jDocumentSubject model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_document_subject',

  attributes: {
    document: {
      columnName: 'id_document',
      model: 'TDocument',
    },

    subject: {
      columnName: 'code_subject',
      model: 'TSubject',
    },
  },
};
