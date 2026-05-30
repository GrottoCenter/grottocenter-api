/**
 * TMethod.js
 *
 * @description :: Lookup table for sampling methods/protocols
 */

module.exports = {
  tableName: 't_method',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
      columnName: 'id',
      unique: true,
    },

    url: {
      type: 'string',
      allowNull: false,
      columnName: 'url',
      maxLength: 500,
    },

    names: {
      collection: 'TName',
      via: 'method',
    },

    descriptions: {
      collection: 'TDescription',
      via: 'method',
    },
  },
};
