/**
 * TTimeSeries.js
 *
 * @description :: A sequence of measurements from a single sensor configuration
 */

module.exports = {
  tableName: 't_time_series',

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

    sensorConfiguration: {
      allowNull: false,
      columnName: 'id_sensor_configuration',
      model: 'TSensorConfiguration',
    },

    medium: {
      columnName: 'id_medium',
      model: 'TMedium',
    },

    samplingIntervalSeconds: {
      type: 'number',
      allowNull: true,
      columnName: 'sampling_interval_seconds',
    },

    // Denormalized aggregates — maintained by application at import time
    startDate: {
      type: 'ref',
      columnName: 'start_date',
      columnType: 'timestamptz',
    },

    // Denormalized aggregates — maintained by application at import time
    endDate: {
      type: 'ref',
      columnName: 'end_date',
      columnType: 'timestamptz',
    },

    // Denormalized aggregates — maintained by application at import time
    measurementCount: {
      type: 'number',
      allowNull: true,
      columnName: 'measurement_count',
    },

    // Denormalized aggregates — maintained by application at import time
    minValue: {
      type: 'number',
      allowNull: true,
      columnName: 'min_value',
    },

    // Denormalized aggregates — maintained by application at import time
    maxValue: {
      type: 'number',
      allowNull: true,
      columnName: 'max_value',
    },

    dataQuality: {
      type: 'string',
      allowNull: false,
      columnName: 'data_quality',
      defaultsTo: 'raw',
      isIn: ['raw', 'validated', 'suspect', 'rejected'],
    },

    // Denormalized fields for BI
    quantityKindCode: {
      type: 'string',
      allowNull: false,
      columnName: 'quantity_kind_code',
      maxLength: 100,
    },

    unitSymbol: {
      type: 'string',
      allowNull: false,
      columnName: 'unit_symbol',
      maxLength: 20,
    },

    mediumCode: {
      type: 'string',
      allowNull: true,
      columnName: 'medium_code',
      maxLength: 100,
    },

    substanceLabel: {
      type: 'string',
      allowNull: true,
      columnName: 'substance_label',
      maxLength: 200,
    },

    substance: {
      model: 'TSubstance',
      columnName: 'id_substance',
    },

    timezoneOffset: {
      type: 'string',
      allowNull: true,
      columnName: 'timezone_offset',
      maxLength: 50,
    },

    isDeleted: {
      type: 'boolean',
      allowNull: false,
      columnName: 'is_deleted',
      defaultsTo: false,
    },
  },
};
