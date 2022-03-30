/**
 * TEntrance.js
 *
 * @description :: tEntrance model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_entrance',

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

    address: {
      type: 'string',
      allowNull: true,
      columnName: 'address',
      maxLength: 200,
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

    dateReviewed: {
      type: 'ref',
      columnType: 'timestamp',
      columnName: 'date_reviewed',
    },

    names: {
      collection: 'TName',
      via: 'entrance',
    },

    descriptions: {
      collection: 'TDescription',
      via: 'entrance',
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

    altitude: {
      type: 'number',
      allowNull: true,
      columnName: 'altitude',
    },

    isOfInterest: {
      type: 'boolean',
      columnName: 'is_of_interest',
    },

    isDeleted: {
      type: 'boolean',
      allowNull: false,
      columnName: 'is_deleted',
      defaultsTo: false,
    },

    precision: {
      type: 'number',
      allowNull: true,
      columnName: 'precision',
      columnType: 'int2',
    },

    cave: {
      columnName: 'id_cave',
      model: 'TCave',
    },

    country: {
      columnName: 'id_country',
      model: 'TCountry',
    },

    idDbImport: {
      type: 'number',
      columnName: 'id_db_import',
      allowNull: true,
    },

    nameDbImport: {
      type: 'string',
      columnName: 'name_db_import',
      allowNull: true,
    },

    geology: {
      columnName: 'id_geology',
      allowNull: false,
      model: 'TGeology',
    },

    documents: {
      collection: 'Tdocument',
      via: 'entrance',
    },

    locations: {
      collection: 'TLocation',
      via: 'entrance',
    },

    riggings: {
      collection: 'TRigging',
      via: 'entrance',
    },

    comments: {
      collection: 'TComment',
      via: 'entrance',
    },

    explorerCavers: {
      collection: 'TCaver',
      via: 'entrance',
      through: 'JEntranceCaver',
    },

    histories: {
      collection: 'THistory',
      via: 'entrance',
    },
  },
};
