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

    names: {
      collection: 'TName',
      via: 'cave',
    },

    minDepth: {
      type: 'number',
      columnName: 'min_depth',
      allowNull: true,
    },

    maxDepth: {
      type: 'number',
      columnName: 'max_depth',
      allowNull: true,
    },

    depth: {
      type: 'number',
      columnName: 'depth',
      allowNull: true,
    },

    length: {
      type: 'number',
      columnName: 'length',
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

    // Sails' ORM, Waterline, doesn't support large number: that's why we use the type 'string' for the latitude
    latitude: {
      type: 'string',
      allowNull: true,
      columnName: 'latitude',
      columnType: 'numeric(24,20)',
    },

    // Sails' ORM, Waterline, doesn't support large number: that's why we use the type 'string' for the longitude
    longitude: {
      type: 'string',
      allowNull: true,
      columnName: 'longitude',
      columnType: 'numeric(24,20)',
    },

    massif: {
      allowNull: false,
      columnName: 'id_massif',
      model: 'TMassif',
    },

    exploringGrottos: {
      collection: 'TGrotto',
      via: 'cave',
      through: 'JGrottoCaveExplorer',
    },

    partneringGrottos: {
      collection: 'TGrotto',
      via: 'cave',
      through: 'JGrottoCavePartner',
    },

    entrances: {
      collection: 'TEntrance',
      via: 'cave',
    },

    descriptions: {
      collection: 'TDescription',
      via: 'cave',
    },

    documents: {
      collection: 'TDocument',
      via: 'cave',
    },
  },
};
