/**
 * TMassif.js
 *
 * @description :: tMassif model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_massif',

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

    names: {
      collection: 'TName',
      via: 'massif',
    },

    descriptions: {
      collection: 'TDescription',
      via: 'massif',
    },

    geogPolygon: {
      type: 'string',
      allowNull: true,
      columnName: 'geog_polygon',
      maxLength: 2000,
    },

    caves: {
      collection: 'TCave',
      via: 'id_massif',
    },
  },
};
