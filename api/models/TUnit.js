/**
 * TUnit.js
 *
 * @description :: Lookup table for units of measurement with SI conversion factors
 *
 * Conversion semantics:
 *   value_display = value_si * siToDisplayFactor + siToDisplayOffset
 *   value_si = (value_display - siToDisplayOffset) / siToDisplayFactor
 *
 * The `dimension` field groups units that are physically interconvertible
 * (e.g., °C, °F, K all have dimension 'temperature'). Units in different
 * dimensions cannot be meaningfully converted to each other.
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
      columnName: 'si_to_display_factor',
      columnType: 'numeric',
      defaultsTo: '1',
    },

    // See siToDisplayFactor comment above — same rationale.
    siToDisplayOffset: {
      type: 'string',
      allowNull: false,
      columnName: 'si_to_display_offset',
      columnType: 'numeric',
      defaultsTo: '0',
    },

    // Physical dimension grouping. Units with the same dimension are
    // interconvertible via their SI factors. Units with different dimensions
    // cannot be meaningfully converted (e.g., mg/L ↛ µM without molar mass).
    dimension: {
      type: 'string',
      allowNull: false,
      columnName: 'dimension',
      maxLength: 50,
    },
  },
};
