/**
 * JOrganizationCountry.js
 *
 * @description :: jOrganizationCountry model for linking an organization to a country
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_organization_country',

  attributes: {
    grotto: {
      columnName: 'id_grotto',
      model: 'TGrotto',
    },

    country: {
      columnName: 'id_country',
      model: 'TCountry',
    },

    author: {
      columnName: 'id_author',
      model: 'TCaver',
    },

    reviewer: {
      columnName: 'id_reviewer',
      model: 'TCaver',
    },

    dateInscription: {
      columnName: 'date_inscription',
      type: 'ref',
      columnType: 'timestamp',
    },

    dateReviewed: {
      columnName: 'date_reviewed',
      type: 'ref',
      columnType: 'timestamp',
    },
  },
};
