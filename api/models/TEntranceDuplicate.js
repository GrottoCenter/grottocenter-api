/**
 * TEntranceDuplicate.js
 *
 * @description :: tEntranceDuplicate model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_entrance_duplicate',

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
    entrance: {
      model: 'TEntrance',
      columnName: 'id_entrance',
    },
  },
};
