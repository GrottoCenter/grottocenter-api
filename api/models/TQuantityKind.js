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

    siToDisplayFactor: {
      type: 'number',
      allowNull: false,
      columnName: 'si_to_display_factor',
      defaultsTo: 1,
    },

    siToDisplayOffset: {
      type: 'number',
      allowNull: false,
      columnName: 'si_to_display_offset',
      defaultsTo: 0,
    },
  },
};
