/**
 * JDocumentLanguage.js
 *
 * @description :: jDocumentLanguage model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_document_language',

  attributes: {
    document: {
      columnName: 'id_document',
      model: 'TDocument',
    },

    language: {
      columnName: 'id_language',
      model: 'TLanguage',
    },

    isMain: {
      columnName: 'is_main',
      allowNull: false,
      defaultsTo: true,
      type: 'boolean',
    },
  },
};
