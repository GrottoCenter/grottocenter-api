/**
 * JDocumentEntrance.js
 *
 * @description :: Junction table for document-entrance many-to-many relationship
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_document_entrance',

  attributes: {
    document: {
      columnName: 'id_document',
      model: 'TDocument',
      required: true,
    },

    entrance: {
      columnName: 'id_entrance',
      model: 'TEntrance',
      required: true,
    },
  },
};
