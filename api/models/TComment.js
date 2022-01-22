/**
 * TComment.js
 *
 * @description :: tComment model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_comment',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
      columnName: 'id',
      unique: true,
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

    dateReviewed: {
      type: 'ref',
      columnName: 'date_reviewed',
      columnType: 'timestamp',
    },

    relevance: {
      type: 'number',
      allowNull: false,
      columnName: 'relevance',
    },

    eTUnderground: {
      type: 'string',
      allowNull: true,
      columnName: 'e_t_underground',
    },

    eTTrail: {
      type: 'string',
      allowNull: true,
      columnName: 'e_t_trail',
    },

    aestheticism: {
      type: 'number',
      allowNull: true,
      columnName: 'aestheticism',
    },

    caving: {
      type: 'number',
      allowNull: true,
      columnName: 'caving',
    },

    approach: {
      type: 'number',
      allowNull: true,
      columnName: 'approach',
    },

    title: {
      type: 'string',
      allowNull: false,
      columnName: 'title',
      maxLength: 300,
    },

    body: {
      type: 'string',
      allowNull: false,
      columnName: 'body',
    },

    alert: {
      type: 'boolean',
      allowNull: false,
      defaultsTo: false,
      columnName: 'alert',
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

    language: {
      columnName: 'id_language',
      model: 'TLanguage',
    },
  },
};
