/**
 * TUnit.js
 *
 * @description :: Lookup table for units of measurement with SI conversion factors
 *
 * Conversion semantics:
 *   value_display = value_si * siToDisplayFactor + siToDisplayOffset
 *   value_si = (value_display - siToDisplayOffset) / siToDisplayFactor
 */

module.exports = {
  tableName: 't_unit',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
      columnName: 'id',
      unique: true,
    },

    code: {
      type: 'string',
      allowNull: false,
      columnName: 'code',
      maxLength: 100,
    },

    symbol: {
      type: 'string',
      allowNull: false,
      columnName: 'symbol',
      maxLength: 20,
    },

    // Declared as type: 'string' because Waterline returns PostgreSQL `numeric`
    // columns as strings to avoid JavaScript floating-point precision loss.
    // Consumers (e.g. SIConverter) must coerce with Number() before arithmetic.
    siToDisplayFactor: {
      type: 'string',
      allowNull: false,
      columnName: 'factor_to_si',
      columnType: 'numeric',
      defaultsTo: '1',
    },

    // See siToDisplayFactor comment above — same rationale.
    siToDisplayOffset: {
      type: 'string',
      allowNull: false,
      columnName: 'offset_to_si',
      columnType: 'numeric',
      defaultsTo: '0',
    },
  },
};
