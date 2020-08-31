/**
 * TRegion.js
 *
 * @description :: tRegion model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_region',

  attributes: {
    id: {
      type: 'string',
      allowNull: false,
      columnName: 'id',
      required: true,
    },

    code: {
      type: 'string',
      allowNull: false,
      columnName: 'code',
      maxLength: 20,
    },

    isDeprecated: {
      type: 'boolean',
      allowNull: false,
      columnName: 'is_deprecated',
    },

    name: {
      type: 'string',
      allowNull: true,
      maxLength: 300,
    },

    country: {
      columnName: 'id_country',
      model: 'TCountry',
    },

    documents: {
      collection: 'TDocument',
      via: 'region',
      through: 'JDocumentRegion',
    },
  },
};
