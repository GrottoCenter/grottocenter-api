/**
 * TQuantityKind.js
 *
 * @description :: Lookup table for physical quantity kinds (QUDT aligned)
 *
 * Quantity kinds describe WHAT is measured (Temperature, Pressure, Concentration).
 * Conversion factors live on TUnit (HOW the measurement is expressed).
 * Each QK has a preferred display unit for human-friendly presentation.
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

    displayUnit: {
      model: 'TUnit',
      columnName: 'id_display_unit',
    },
  },
};
