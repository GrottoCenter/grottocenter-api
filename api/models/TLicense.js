/**
 * TLicense.js
 *
 * @description :: tLicense model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_license',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      columnName: 'id',
      required: true,
    },

    isCopyrighted: {
      type: 'boolean',
      allowNull: false,
      columnName: 'is_copyrighted',
    },

    name: {
      type: 'string',
      allowNull: false,
      columnName: 'name',
      maxLength: 30,
    },

    text: {
      type: 'string',
      allowNull: true,
      columnName: 'text',
    },

    url: {
      type: 'string',
      allowNull: false,
      columnName: 'url',
      maxLength: 100,
    },
  },
};
