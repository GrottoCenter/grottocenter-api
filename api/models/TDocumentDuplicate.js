/**
 * TDocumentDuplicate.js
 *
 * @description :: tDocumentDuplicate model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_document_duplicate',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
      columnName: 'id',
      unique: true,
    },
    author: {
      columnName: 'id_author',
      model: 'TCaver',
    },
    content: {
      type: 'json',
      allowNull: false,
      columnName: 'content',
    },
    dateInscription: {
      type: 'ref',
      columnName: 'date_inscription',
      columnType: 'timestamp',
    },
    document: {
      model: 'TDocument',
      columnName: 'id_document',
    },
  },
};
