/**
 * TUnit.js
 *
 * @description :: Lookup table for units of measurement
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
  },
};
