/**
 * TSensorConfiguration.js
 *
 * @description :: Per-channel configuration of a device (quantity kind, unit, precision, detection limits)
 */

module.exports = {
  tableName: 't_sensor_configuration',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
      columnName: 'id',
      unique: true,
    },

    device: {
      allowNull: false,
      columnName: 'id_device',
      model: 'TDevice',
    },

    quantityKind: {
      allowNull: false,
      columnName: 'id_quantity_kind',
      model: 'TQuantityKind',
    },

    unit: {
      allowNull: false,
      columnName: 'id_unit',
      model: 'TUnit',
    },

    precisionUpper: {
      type: 'number',
      allowNull: true,
      columnName: 'precision_upper',
    },

    precisionLower: {
      type: 'number',
      allowNull: true,
      columnName: 'precision_lower',
    },

    resolution: {
      type: 'number',
      allowNull: true,
      columnName: 'resolution',
    },

    detectionLimitMin: {
      type: 'number',
      allowNull: true,
      columnName: 'detection_limit_min',
    },

    detectionLimitMax: {
      type: 'number',
      allowNull: true,
      columnName: 'detection_limit_max',
    },

    label: {
      type: 'string',
      allowNull: true,
      columnName: 'label',
      maxLength: 300,
    },

    // Audit fields
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

    isDeleted: {
      type: 'boolean',
      allowNull: false,
      columnName: 'is_deleted',
      defaultsTo: false,
    },
  },
};
