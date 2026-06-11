/**
 * TQuantityKind.js
 *
 * @description :: Lookup table for physical quantity kinds (QUDT aligned)
 */

module.exports = {
  tableName: 't_quantity_kind',

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

    url: {
      type: 'string',
      allowNull: false,
      columnName: 'url',
      maxLength: 500,
    },

    symbolSi: {
      type: 'string',
      allowNull: false,
      columnName: 'symbol_si',
      maxLength: 20,
    },

    displaySymbol: {
      type: 'string',
      allowNull: false,
      columnName: 'display_symbol',
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
  },
};
