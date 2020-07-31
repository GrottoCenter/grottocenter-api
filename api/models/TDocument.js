/**
 * TDocument.js
 *
 * @description :: tDocument model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_document',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
      columnName: 'id',
      unique: true,
    },

    author: {
      allowNull: false,
      columnName: 'id_author',
      model: 'TCaver',
    },

    reviewer: {
      columnName: 'id_reviewer',
      model: 'TCaver',
    },

    validator: {
      columnName: 'id_validator',
      model: 'TCaver',
    },

    dateInscription: {
      type: 'string',
      allowNull: false,
      columnName: 'date_inscription',
      columnType: 'datetime',
      defaultsTo: '2000-01-01 00:00:00',
    },

    dateValidation: {
      type: 'string',
      columnName: 'date_validation',
      columnType: 'datetime',
    },

    datePublication: {
      type: 'string',
      columnName: 'date_publication',
      columnType: 'datetime',
    },

    isValidated: {
      type: 'boolean',
      allowNull: false,
      columnName: 'is_validated',
      defaultsTo: false,
    },

    validationComment: {
      type: 'string',
      maxLength: 300,
      columnName: 'validation_comment',
    },

    pages: {
      type: 'string',
      maxLength: 20,
      columnName: 'pages',
    },

    identifier: {
      type: 'string',
      maxLength: 250,
      columnName: 'identifier',
    },

    identifierType: {
      columnName: 'identifier_type',
      model: 'TIdentifierType',
    },

    refBbs: {
      type: 'string',
      maxLength: 10,
      columnName: 'ref_bbs',
    },

    entrance: {
      columnName: 'id_entrance',
      model: 'TEntrance',
    },

    massif: {
      columnName: 'id_massif',
      model: 'TMassif',
    },

    cave: {
      columnName: 'id_cave',
      model: 'TCave',
    },

    authorCaver: {
      columnName: 'id_author_caver',
      model: 'TCaver',
    },

    authorGrotto: {
      columnName: 'id_author_grotto',
      model: 'TGrotto',
    },

    editor: {
      columnName: 'id_editor',
      model: 'TGrotto',
    },

    library: {
      columnName: 'id_library',
      model: 'TGrotto',
    },

    type: {
      allowNull: false,
      columnName: 'id_type',
      model: 'TType',
    },

    parent: {
      columnName: 'id_parent',
      model: 'TDocument',
    },

    license: {
      allowNull: false,
      columnName: 'id_license',
      model: 'TLicense',
    },
  },
};
