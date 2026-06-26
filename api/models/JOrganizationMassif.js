/**
 * JOrganizationMassif.js
 *
 * @description :: jOrganizationMassif model for linking an organization to a massif
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_organization_massif',

  attributes: {
    grotto: {
      columnName: 'id_grotto',
      model: 'TGrotto',
    },

    massif: {
      columnName: 'id_massif',
      model: 'TMassif',
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
