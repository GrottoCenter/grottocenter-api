/**
 * TSubject.js
 *
 * @description :: tSubject model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_subject',

  attributes: {
    id: {
      type: 'string',
      allowNull: false,
      columnName: 'code',
      maxLength: 5,
      required: true,
    },

    subject: {
      type: 'string',
      allowNull: false,
      columnName: 'subject',
      maxLength: 300,
    },

    parent: {
      model: 'TSubject',
      via: 'children',
      columnName: 'code_parent',
    },

    children: {
      collection: 'TSubject',
      via: 'parent',
    },
  },
};
