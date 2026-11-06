/**
 * TISO31662.js
 *
 * @description :: TISO31662 model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_iso3166_2',

  attributes: {
    id: {
      type: 'string',
      allowNull: false,
      columnName: 'iso',
      unique: true,
      required: true,
      maxLength: 10,
    },

    name: {
      type: 'string',
      allowNull: false,
      columnName: 'name',
      maxLength: 200,
    },

    documents: {
      collection: 'TDocument',
      via: 'iso',
      through: 'JDocumentISO31662',
    },

    subscribedCavers: {
      collection: 'TCaver',
      via: 'region',
      through: 'JCaverRegionSubscription',
    },

    guidelines: {
      collection: 'TGuideline',
      via: 'region',
      through: 'JGuidelineRegion',
    },

    organizations: {
      collection: 'TGrotto',
      via: 'region',
      through: 'JOrganizationRegion',
    },
  },
};
