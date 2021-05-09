/**
 * TCave.js
 *
 * @description :: tCave model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

// ===== 05/04/2021 - Note from Clément ROIG ===== //
/**
 * The TCave.create() function doesn't work with TCave field alias.
 * See https://github.com/balderdashy/sails/issues/7106
 */
/* eslint-disable camelcase */

module.exports = {
  tableName: 't_cave',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
      columnName: 'id',
      unique: true,
    },

    id_author: {
      allowNull: false,
      columnName: 'id_author',
      model: 'TCaver',
    },

    id_reviewer: {
      columnName: 'id_reviewer',
      model: 'TCaver',
    },

    names: {
      collection: 'TName',
      via: 'cave',
    },

    min_depth: {
      type: 'number',
      columnName: 'min_depth',
      allowNull: true,
    },

    max_depth: {
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

    is_diving: {
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

    date_inscription: {
      type: 'ref',
      allowNull: false,
      columnName: 'date_inscription',
      columnType: 'datetime',
    },

    date_reviewed: {
      type: 'ref',
      allowNull: false,
      columnName: 'date_reviewed',
      columnType: 'datetime',
    },

    is_deleted: {
      type: 'boolean',
      allowNull: false,
      columnName: 'is_deleted',
      defaultsTo: false,
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

    id_massif: {
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
/* eslint-enable camelcase */
