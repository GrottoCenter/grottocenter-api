/**
 * TCave.js
 *
 * @description :: tCave model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_cave',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      allowNull: false,
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
      allowNull: false,
      columnName: 'id_reviewer',
      model: 'TCaver',
      required: true,
    },

    minDepth: {
      type: 'number',
      columnName: 'Min_depth',
      allowNull: true,
    },

    maxDepth: {
      type: 'number',
      columnName: 'Max_depth',
      allowNull: true,
    },

    depth: {
      type: 'number',
      columnName: 'Depth',
      allowNull: true,
    },

    length: {
      type: 'number',
      columnName: 'Length',
      allowNull: true,
    },

    isDiving: {
      type: 'boolean',
      allowNull: false,
      columnName: 'is_diving',
      defaultsTo: false,
    },

    temperature: {
      type: 'number',
      allowNull: true,
      columnName: 'temperature',
    },

    dateInscription: {
      type: 'ref',
      allowNull: false,
      columnName: 'date_inscription',
      columnType: 'datetime',
      defaultsTo: '2000-01-01 00:00:00',
    },

    dateReviewed: {
      type: 'ref',
      allowNull: false,
      columnName: 'date_reviewed',
      columnType: 'datetime',
    },

    latitude: {
      type: 'number',
      columnName: 'latitude',
      columnType: 'numeric(24,20)',
    },

    longitude: {
      type: 'number',
      columnName: 'longitude',
      columnType: 'numeric(24,20)',
    },

    massif: {
      allowNull: false,
      via: 'id_massif',
      model: 'TMassif',
    },
  },
};
