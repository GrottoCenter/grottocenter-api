/**
 * TGrotto.js
 *
 * @description :: tGrotto model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_grotto',

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

    village: {
      type: 'string',
      allowNull: true,
      maxLength: 100,
      columnName: 'village',
    },

    county: {
      type: 'string',
      allowNull: true,
      maxLength: 100,
      columnName: 'county',
    },

    region: {
      type: 'string',
      allowNull: true,
      maxLength: 100,
      columnName: 'region',
    },

    city: {
      type: 'string',
      allowNull: true,
      maxLength: 100,
      columnName: 'city',
    },

    postalCode: {
      type: 'string',
      allowNull: true,
      columnName: 'postal_code',
      maxLength: 5,
    },

    address: {
      type: 'string',
      allowNull: true,
      columnName: 'address',
      maxLength: 200,
    },

    mail: {
      type: 'string',
      allowNull: true,
      columnName: 'mail',
      maxLength: 50,
    },

    yearBirth: {
      type: 'number',
      allowNull: true,
      columnName: 'year_birth',
      max: new Date().getFullYear(),
    },

    dateInscription: {
      type: 'ref',
      allowNull: false,
      columnType: 'datetime',
      columnName: 'date_inscription',
    },

    dateReviewed: {
      type: 'ref',
      columnType: 'datetime',
      columnName: 'date_reviewed',
    },

    names: {
      collection: 'TName',
      via: 'grotto',
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

    customMessage: {
      type: 'string',
      columnName: 'custom_message',
      allowNull: true,
    },

    isOfficialPartner: {
      type: 'boolean',
      allowNull: false,
      columnName: 'is_official_partner',
      defaultsTo: false,
    },

    url: {
      type: 'string',
      allowNull: true,
      columnName: 'url',
      maxLength: 200,
    },

    isDeleted: {
      type: 'boolean',
      allowNull: false,
      columnName: 'is_deleted',
      defaultsTo: false,
    },

    country: {
      columnName: 'id_country',
      model: 'TCountry',
    },

    pictureFileName: {
      type: 'string',
      allowNull: true,
      columnName: 'picture_file_name',
      maxLength: 100,
    },

    cavers: {
      collection: 'TCaver',
      via: 'grotto',
      through: 'JGrottoCaver',
    },

    exploredCaves: {
      collection: 'TCave',
      via: 'grotto',
      through: 'JGrottoCaveExplorer',
    },

    partneredCaves: {
      collection: 'TCave',
      via: 'grotto',
      through: 'JGrottoCavePartner',
    },

    documents: {
      collection: 'TDocument',
      via: 'grotto',
      through: 'JDocumentGrottoAuthor',
    },
  },
};
