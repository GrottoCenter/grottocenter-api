/**
 * HLocation.js
 *
 * @description :: hLocation model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'h_location',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'string',
      required: true,
      columnName: 'date_reviewed',
      columnType: 'timestamp',
      unique: true,
    },

    t_id: {
      required: true,
      type: 'number',
      columnName: 'id',
      unique: false,
    },

    author: {
      allowNull: false,
      columnName: 'id_author',
      model: 'TCaver',
    },

    reviewer: {
      columnName: 'id_reviewer',
      model: 'TCaver',
    },

    dateInscription: {
      type: 'ref',
      allowNull: false,
      columnName: 'date_inscription',
      columnType: 'timestamp',
    },

    relevance: {
      type: 'number',
      allowNull: false,
      columnName: 'relevance',
    },

    body: {
      type: 'string',
      allowNull: false,
      columnName: 'body',
    },

    title: {
      type: 'string',
      allowNull: true,
      columnName: 'title',
    },

    entrance: {
      allowNull: false,
      columnName: 'id_entrance',
      model: 'TEntrance',
    },

    language: {
      allowNull: false,
      columnName: 'id_language',
      model: 'TLanguage',
    },
  },
};
