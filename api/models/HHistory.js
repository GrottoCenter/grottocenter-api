/**
 * HHistory.js
 *
 * @description :: hHistory model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'h_history',

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
      required: true,
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
      defaultsTo: 0,
    },

    body: {
      type: 'string',
      allowNull: false,
      columnName: 'body',
    },

    cave: {
      columnName: 'id_cave',
      model: 'TCave',
    },

    entrance: {
      columnName: 'id_entrance',
      model: 'TEntrance',
    },

    point: {
      columnName: 'id_point',
      model: 'TPoint',
    },

    language: {
      columnName: 'id_language',
      model: 'TLanguage',
    },
  },
};
