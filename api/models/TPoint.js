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
      columnType: 'datetime',
      columnName: 'date_inscription',
      defaultsTo: '2000-01-01 00:00:00',
    },

    dateReviewed: {
      type: 'ref',
      columnType: 'datetime',
      columnName: 'date_reviewed',
    },

    relLatitude: {
      type: 'number',
      allowNull: false,
      columnName: 'rel_latitude',
    },

    relLongitude: {
      type: 'number',
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
