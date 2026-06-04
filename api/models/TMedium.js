/**
 * TMedium.js
 *
 * @description :: Lookup table for environmental media (water, air, soil, etc.)
 */

module.exports = {
  tableName: 't_medium',

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
  },
};
