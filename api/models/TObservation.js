/**
 * TObservation.js
 *
 * @description :: Scientific observation event at a specific point and time
 */

module.exports = {
  tableName: 't_observation',

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

    observationDate: {
      type: 'ref',
      columnName: 'observation_date',
      columnType: 'timestamptz',
    },

    point: {
      columnName: 'id_point',
      model: 'TPoint',
    },

    cave: {
      columnName: 'id_cave',
      model: 'TCave',
    },

    observationType: {
      allowNull: false,
      columnName: 'id_observation_type',
      model: 'TObservationType',
    },

    // Denormalized fields for BI
    caveName: {
      type: 'string',
      allowNull: true,
      columnName: 'cave_name',
      maxLength: 200,
    },

    observationTypeCode: {
      type: 'string',
      allowNull: false,
      columnName: 'observation_type_code',
      maxLength: 100,
    },

    pointLabel: {
      type: 'string',
      allowNull: true,
      columnName: 'point_label',
      maxLength: 200,
    },

    latitude: {
      type: 'string',
      allowNull: true,
      columnName: 'latitude',
      columnType: 'numeric(24,20)',
    },

    longitude: {
      type: 'string',
      allowNull: true,
      columnName: 'longitude',
      columnType: 'numeric(24,20)',
    },

    timeSeries: {
      collection: 'TTimeSeries',
      via: 'observation',
    },

    humanActivities: {
      collection: 'THumanActivity',
      via: 'observation',
    },

    contaminations: {
      collection: 'TContamination',
      via: 'observation',
    },

    names: {
      collection: 'TName',
      via: 'observation',
    },

    descriptions: {
      collection: 'TDescription',
      via: 'observation',
    },

    isDeleted: {
      type: 'boolean',
      allowNull: false,
      columnName: 'is_deleted',
      defaultsTo: false,
    },
  },
};
