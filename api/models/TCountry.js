/**
 * TCountry.js
 *
 * @description :: tCountry model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_country',

  attributes: {
    id: {
      type: 'string',
      columnName: 'iso',
      maxLength: 2,
      unique: true,
      required: true,
    },

    iso3: {
      type: 'string',
      allowNull: false,
      maxLength: 3,
    },

    numeric: {
      type: 'number',
      allowNull: false,
      columnName: 'numeric',
    },

    // Sails' ORM, Waterline, doesn't support large number: that's why we use the type 'string' for the latitude
    latitude: {
      type: 'string',
      columnName: 'latitude',
      columnType: 'numeric(24,20)',
    },

    // Sails' ORM, Waterline, doesn't support large number: that's why we use the type 'string' for the longitude
    longitude: {
      type: 'string',
      columnName: 'longitude',
      columnType: 'numeric(24,20)',
    },

    nativeName: {
      type: 'string',
      columnName: 'native_name',
      maxLength: 50,
    },

    enName: {
      type: 'string',
      allowNull: false,
      columnName: 'en_name',
      maxLength: 50,
    },

    frName: {
      type: 'string',
      allowNull: false,
      columnName: 'fr_name',
      maxLength: 50,
    },

    esName: {
      type: 'string',
      allowNull: false,
      columnName: 'es_name',
      maxLength: 50,
    },

    deName: {
      type: 'string',
      allowNull: false,
      columnName: 'de_name',
      maxLength: 50,
    },

    bgName: {
      type: 'string',
      allowNull: false,
      columnName: 'bg_name',
      maxLength: 50,
    },

    itName: {
      type: 'string',
      allowNull: false,
      columnName: 'it_name',
      maxLength: 50,
    },

    caName: {
      type: 'string',
      allowNull: false,
      columnName: 'ca_name',
      maxLength: 50,
    },

    nlName: {
      type: 'string',
      allowNull: false,
      columnName: 'nl_name',
      maxLength: 50,
    },

    rsName: {
      type: 'string',
      allowNull: false,
      columnName: 'rs_name',
      maxLength: 50,
    },
  },
};
