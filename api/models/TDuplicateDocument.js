/**
 * TDuplicateDocument.js
 *
 * @description :: tDuplicateDocument model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_duplicate_document',

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
    date: {
      type: 'ref',
      columnName: 'date',
      columnType: 'datetime',
    },
    document: {
      model: 'TDocument',
      columnName: 'id_document',
    },
  },
};
