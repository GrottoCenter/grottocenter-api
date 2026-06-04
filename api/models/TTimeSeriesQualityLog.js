/**
 * TTimeSeriesQualityLog.js
 *
 * @description :: Audit trail for data_quality transitions on time series
 */

module.exports = {
  tableName: 't_time_series_quality_log',

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

    oldQuality: {
      type: 'string',
      allowNull: true,
      columnName: 'old_quality',
      maxLength: 20,
    },

    newQuality: {
      type: 'string',
      allowNull: false,
      columnName: 'new_quality',
      maxLength: 20,
    },

    changedBy: {
      allowNull: false,
      columnName: 'changed_by',
      model: 'TCaver',
    },

    changedAt: {
      type: 'ref',
      columnName: 'changed_at',
      columnType: 'timestamptz',
    },
  },
};
