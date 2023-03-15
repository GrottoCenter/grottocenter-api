/**
 * HEntrance.js
 *
 * @description :: hEntrance model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'h_entrance',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'string',
      required: true,
      columnName: 'date_reviewed',
      columnType: 'timestamp',
      unique: true,
    },

    t_id: {
      required: true,
      type: 'number',
      columnName: 'id',
      unique: false,
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

    region: {
      type: 'string',
      allowNull: true,
      columnName: 'region',
      maxLength: 100,
    },

    county: {
      type: 'string',
      allowNull: true,
      columnName: 'county',
      maxLength: 100,
    },

    city: {
      type: 'string',
      allowNull: true,
      columnName: 'city',
      maxLength: 100,
    },

    iso_3166_2: {
      type: 'string',
      allowNull: true,
      columnName: 'iso_3166_2',
      maxLength: 10,
    },

    yearDiscovery: {
      type: 'number',
      allowNull: true,
      columnName: 'year_discovery',
      max: new Date().getFullYear(),
    },

    externalUrl: {
      type: 'string',
      allowNull: true,
      columnName: 'external_url',
      maxLength: 2000,
    },

    dateInscription: {
      type: 'ref',
      allowNull: false,
      columnName: 'date_inscription',
      columnType: 'timestamp',
    },

    isPublic: {
      type: 'boolean',
      columnName: 'is_public',
    },

    isSensitive: {
      type: 'boolean',
      allowNull: false,
      columnName: 'is_sensitive',
      defaultsTo: false,
    },

    contact: {
      type: 'string',
      maxLength: 1000,
      columnName: 'contact',
      allowNull: true,
    },

    modalities: {
      type: 'string',
      allowNull: false,
      maxLength: 100,
      defaultsTo: 'NO,NO,NO,NO',
      columnName: 'modalities',
    },

    hasContributions: {
      type: 'boolean',
      allowNull: false,
      columnName: 'has_contributions',
      defaultsTo: false,
    },

    // Sails' ORM, Waterline, doesn't support large number:
    // that's why we use the type 'string' for the latitude
    latitude: {
      type: 'string',
      allowNull: false,
      columnName: 'latitude',
      columnType: 'numeric(24,20)',
    },

    // Sails' ORM, Waterline, doesn't support large number:
    // that's why we use the type 'string' for the longitude
    longitude: {
      type: 'string',
      allowNull: false,
      columnName: 'longitude',
      columnType: 'numeric(24,20)',
    },

    precision: {
      type: 'number',
      allowNull: true,
      columnName: 'precision',
      columnType: 'int2',
    },

    altitude: {
      type: 'number',
      allowNull: true,
      columnName: 'altitude',
    },

    isOfInterest: {
      type: 'boolean',
      columnName: 'is_of_interest',
    },

    cave: {
      columnName: 'id_cave',
      model: 'TCave',
    },

    country: {
      columnName: 'id_country',
      model: 'TCountry',
    },

    geology: {
      columnName: 'id_geology',
      allowNull: false,
      model: 'TGeology',
    },
  },
};
