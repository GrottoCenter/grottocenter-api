/**
 * TContamination.js
 *
 * @description :: Record of contamination observed at a point
 */

module.exports = {
  tableName: 't_contamination',

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

    dateInscription: {
      type: 'ref',
      columnName: 'date_inscription',
      columnType: 'timestamp',
    },

    dateReviewed: {
      type: 'ref',
      columnName: 'date_reviewed',
      columnType: 'timestamp',
    },

    observation: {
      allowNull: false,
      columnName: 'id_observation',
      model: 'TObservation',
    },

    contaminantType: {
      allowNull: false,
      columnName: 'id_contaminant_type',
      model: 'TContaminantType',
    },

    medium: {
      allowNull: false,
      columnName: 'id_medium',
      model: 'TMedium',
    },

    // Denormalized field for BI
    mediumCode: {
      type: 'string',
      allowNull: false,
      columnName: 'medium_code',
      maxLength: 100,
    },

    isDeleted: {
      type: 'boolean',
      allowNull: false,
      columnName: 'is_deleted',
      defaultsTo: false,
    },
  },
};
