/**
 * JDocumentGrottoAuthor.js
 *
 * @description :: jDocumentGrottoAuthor model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

 module.exports = {
    tableName: 'j_document_grotto_author',
  
    attributes: {
      document: {
        columnName: 'id_document',
        model: 'TDocument',
      },
  
      grotto: {
        columnName: 'id_grotto',
        model: 'TGrotto',
      },
    },
  };
  