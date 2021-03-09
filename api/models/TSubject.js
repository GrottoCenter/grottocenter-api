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
      columnName: 'code_parent',
    },

    documents: {
      collection: 'TDocument',
      via: 'subject',
      through: 'JDocumentSubject',
    },
  },
};
