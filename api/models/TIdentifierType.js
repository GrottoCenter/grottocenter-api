/**
 * TIdentiferType.js
 *
 * @description :: tIdentifierType model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_identifier_type',

  attributes: {
    id: {
      type: 'string',
      allowNull: false,
      columnName: 'code',
      required: true,
    },

    text: {
      type: 'string',
      allowNull: false,
      columnName: 'text',
      maxLength: 250,
    },

    regexp: {
      type: 'string',
      allowNull: false,
      columnName: 'regexp',
      maxLength: 250,
    },
  },
};
