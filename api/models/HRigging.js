/**
 * HRigging.js
 *
 * @description :: hRigging model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'h_rigging',

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

    title: {
      type: 'string',
      allowNull: false,
      columnName: 'title',
      maxLength: 300,
    },

    obstacles: {
      type: 'string',
      allowNull: true,
      columnName: 'obstacles',
      maxLength: 2000,
    },

    ropes: {
      type: 'string',
      allowNull: true,
      columnName: 'ropes',
      maxLength: 2000,
    },

    anchors: {
      type: 'string',
      allowNull: true,
      columnName: 'anchors',
      maxLength: 2000,
    },

    observations: {
      type: 'string',
      allowNull: true,
      columnName: 'observations',
      maxLength: 2000,
    },

    cave: {
      columnName: 'id_cave',
      model: 'TCave',
    },

    entrance: {
      columnName: 'id_entrance',
      model: 'TEntrance',
    },

    exit: {
      columnName: 'id_exit',
      model: 'TEntrance',
    },

    point: {
      columnName: 'id_point',
      model: 'TPoint',
    },

    language: {
      allowNull: false,
      columnName: 'id_language',
      model: 'TLanguage',
    },
  },
};
