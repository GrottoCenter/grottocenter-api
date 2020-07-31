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

    name: {
      type: 'string',
      allowNull: false,
      columnName: 'name',
      maxLength: 30,
    },

    text: {
      type: 'string',
      columnName: 'text',
    },
  },
};
