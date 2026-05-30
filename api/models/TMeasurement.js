/**
 * TMeasurement.js
 *
 * @description :: Individual data point within a time series (partitioned table)
 */

module.exports = {
  tableName: 't_measurement',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
      columnName: 'id',
      unique: true,
    },

    timeSeries: {
      allowNull: false,
      columnName: 'id_time_series',
      model: 'TTimeSeries',
    },

    value: {
      type: 'number',
      allowNull: false,
      columnName: 'value',
    },

    valueSi: {
      type: 'number',
      allowNull: false,
      columnName: 'value_si',
    },

    timestamp: {
      type: 'ref',
      columnName: 'timestamp',
      columnType: 'timestamptz',
    },
  },
};
