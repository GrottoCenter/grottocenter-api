/**
 * TObservationType.js
 *
 * @description :: Lookup table for observation categories
 */

module.exports = {
  tableName: 't_observation_type',

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
