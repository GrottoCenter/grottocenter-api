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
      maxLength: 100,
      columnName: 'village',
    },

    county: {
      type: 'string',
      maxLength: 100,
      columnName: 'county',
    },

    region: {
      type: 'string',
      maxLength: 100,
      columnName: 'region',
    },

    city: {
      type: 'string',
      maxLength: 100,
      columnName: 'city',
    },

    postalCode: {
      type: 'string',
      columnName: 'postal_code',
      maxLength: 5,
    },

    address: {
      type: 'string',
      columnName: 'address',
      maxLength: 200,
    },

    mail: {
      type: 'string',
      columnName: 'mail',
      maxLength: 50,
    },

    yearBirth: {
      type: 'number',
      columnName: 'year_birth',
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

    names: {
      collection: 'TName',
      via: 'grotto',
    },

    country: {
      type: 'string',
      maxLength: 3,
      columnName: 'Country',
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

    customMessage: {
      type: 'string',
      columnName: 'custom_message',
    },

    isOfficialPartner: {
      type: 'boolean',
      allowNull: false,
      columnName: 'is_official_partner',
      defaultsTo: false,
    },

    url: {
      type: 'string',
      columnName: 'url',
      maxLength: 200,
    },

    country: {
      columnName: 'id_country',
      model: 'TCountry',
    },

    pictureFileName: {
      type: 'string',
      columnName: 'picture_file_name',
      maxLength: 100,
    },
  },
};
