/**
 * TPoint.js
 *
 * @description :: tPoint model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_point',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
      columnName: 'id',
      unique: true,
    },

    type: {
      type: 'string',
      allowNull: false,
      maxLength: 8,
      columnName: 'type',
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

    yearDiscovery: {
      type: 'number',
      columnName: 'year_discovery',
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

    // Sails' ORM, Waterline, doesn't support large number: that's why we use the type 'string' for the latitude
    relLatitude: {
      type: 'string',
      allowNull: false,
      columnName: 'rel_latitude',
    },

    // Sails' ORM, Waterline, doesn't support large number: that's why we use the type 'string' for the longitude
    relLongitude: {
      type: 'string',
      allowNull: false,
      columnName: 'rel_longitude',
      columnType: 'numeric(24,20)',
    },

    relDepth: {
      type: 'number',
      columnName: 'rel_depth',
    },

    entrance: {
      columnName: 'id_entrance',
      model: 'TEntrance',
    },

    geology: {
      columnName: 'id_geology',
      model: 'TGeology',
    },
  },
};
