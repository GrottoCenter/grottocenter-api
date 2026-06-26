/**
 * JOrganizationRegion.js
 *
 * @description :: jOrganizationRegion model for linking an organization to a region
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_organization_region',

  attributes: {
    grotto: {
      columnName: 'id_grotto',
      model: 'TGrotto',
    },

    region: {
      columnName: 'id_region',
      model: 'TISO31662',
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
