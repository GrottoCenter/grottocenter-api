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

    // Sails' ORM, Waterline, doesn't support large number:
    // that's why we use the type 'string' for the latitude
    latitude: {
      type: 'string',
      columnName: 'latitude',
      columnType: 'numeric(24,20)',
    },

    // Sails' ORM, Waterline, doesn't support large number:
    // that's why we use the type 'string' for the longitude
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

    subscribedCavers: {
      collection: 'TCaver',
      via: 'country',
      through: 'JCaverCountrySubscription',
    },

    documents: {
      collection: 'TDocument',
      via: 'country',
      through: 'JDocumentCountry',
    },

    guidelines: {
      collection: 'TGuideline',
      via: 'country',
      through: 'JGuidelineCountry',
    },

    organizations: {
      collection: 'TGrotto',
      via: 'country',
      through: 'JOrganizationCountry',
    },
  },
};
