/**
 * TMeasurement.js
 *
 * @description :: Individual data point within a time series (partitioned table)
 *
 * Partitioned table — schema is managed exclusively by SQL migrations.
 * The DDL defines a composite PK (id, timestamp) as required by PostgreSQL
 * for partitioned tables. Do NOT run Waterline in migrate: 'alter' or 'drop'
 * mode with this model.
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
