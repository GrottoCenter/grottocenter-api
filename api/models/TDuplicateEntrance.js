/**
 * TDuplicateEntrance.js
 *
 * @description :: tDuplicateEntrance model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_duplicate_entrance',

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
    datePublication: {
      type: 'ref',
      columnName: 'date_publication',
      columnType: 'timestamp',
    },
    entrance: {
      model: 'TEntrance',
      columnName: 'id_entrance',
    },
  },
};
