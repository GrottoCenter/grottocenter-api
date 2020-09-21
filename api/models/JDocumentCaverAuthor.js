/**
 * JDocumentCaverAuthor.js
 *
 * @description :: jDocumentCaverAuthor model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_document_caver_author',

  attributes: {
    document: {
      columnName: 'id_document',
      model: 'TDocument',
    },

    caver: {
      columnName: 'id_caver',
      model: 'TCaver',
    },
  },
};
