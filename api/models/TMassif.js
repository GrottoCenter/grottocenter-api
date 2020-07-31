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
      columnType: 'datetime',
      columnName: 'date_inscription',
      defaultsTo: '2000-01-01 00:00:00',
    },

    dateReviewed: {
      type: 'ref',
      columnType: 'datetime',
      columnName: 'date_reviewed',
    },

    geometryKml: {
      type: 'string',
      maxLength: 2000,
      columnName: 'geometry_kml',
    },
  },
};
