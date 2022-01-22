/**
 * TName.js
 *
 * @description :: tName model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_name',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
      columnName: 'id',
      unique: true,
    },

    name: {
      type: 'string',
      maxLength: 200,
      columnName: 'name',
    },

    isMain: {
      type: 'boolean',
      allowNull: false,
      columnName: 'is_main',
      defaultsTo: false,
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
      columnType: 'timestamp',
      columnName: 'date_inscription',
    },

    dateReviewed: {
      type: 'ref',
      columnType: 'timestamp',
      columnName: 'date_reviewed',
    },

    language: {
      columnName: 'id_language',
      model: 'TLanguage',
    },

    entrance: {
      columnName: 'id_entrance',
      model: 'TEntrance',
    },

    cave: {
      columnName: 'id_cave',
      model: 'TCave',
    },

    massif: {
      columnName: 'id_massif',
      model: 'TMassif',
    },

    point: {
      columnName: 'id_point',
      model: 'TPoint',
    },

    grotto: {
      columnName: 'id_grotto',
      model: 'TGrotto',
    },
  },
};
