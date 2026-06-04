/**
 * THumanActivity.js
 *
 * @description :: Record of human activity observed at a point
 */

module.exports = {
  tableName: 't_human_activity',

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

    activityType: {
      allowNull: false,
      columnName: 'id_human_activity_type',
      model: 'THumanActivityType',
    },

    isDeleted: {
      type: 'boolean',
      allowNull: false,
      columnName: 'is_deleted',
      defaultsTo: false,
    },
  },
};
