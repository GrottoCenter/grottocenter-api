/**
 * HDescription.js
 *
 * @description :: hDescription model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'h_description',

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
      defaultsTo: 0,
    },

    title: {
      type: 'string',
      allowNull: false,
      columnName: 'title',
      maxLength: 300,
    },

    body: {
      type: 'string',
      allowNull: true,
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

    exit: {
      columnName: 'id_exit',
      model: 'TEntrance',
    },

    massif: {
      columnName: 'id_massif',
      model: 'TMassif',
    },

    point: {
      columnName: 'id_point',
      model: 'TPoint',
    },

    document: {
      columnName: 'id_document',
      model: 'TDocument',
    },

    language: {
      columnName: 'id_language',
      model: 'TLanguage',
    },
  },
};
