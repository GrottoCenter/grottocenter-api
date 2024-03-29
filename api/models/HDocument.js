/**
 * HDocument.js
 *
 * @description :: HDocument model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'h_document',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'string',
      required: true,
      columnName: 'date_reviewed',
      columnType: 'timestamp',
      unique: true,
    },

    t_id: {
      required: true,
      type: 'number',
      columnName: 'id',
      unique: false,
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
      type: 'ref',
      columnName: 'date_inscription',
      columnType: 'timestamp',
    },

    dateValidation: {
      type: 'ref',
      columnName: 'date_validation',
      columnType: 'timestamp',
    },

    datePublication: {
      type: 'string',
      columnName: 'date_publication',
      allowNull: true,
      maxLength: 10,
    },

    isValidated: {
      type: 'boolean',
      allowNull: false,
      columnName: 'is_validated',
      defaultsTo: false,
    },

    validationComment: {
      type: 'string',
      allowNull: true,
      maxLength: 300,
      columnName: 'validation_comment',
    },

    pages: {
      type: 'string',
      allowNull: true,
      maxLength: 20,
      columnName: 'pages',
    },

    identifier: {
      type: 'string',
      allowNull: true,
      maxLength: 250,
      columnName: 'identifier',
    },

    identifierType: {
      columnName: 'id_identifier_type',
      model: 'TIdentifierType',
    },

    refBbs: {
      type: 'string',
      allowNull: true,
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

    pagesBBSOld: {
      type: 'string',
      allowNull: true,
      columnName: 'pages_bbs_old',
      maxLength: 100,
    },

    commentsBBSOld: {
      type: 'string',
      allowNull: true,
      columnName: 'comments_bbs_old',
      maxLength: 500,
    },

    publicationOtherBBSOld: {
      type: 'string',
      allowNull: true,
      columnName: 'publication_other_bbs_old',
      maxLength: 500,
    },

    publicationFasciculeBBSOld: {
      type: 'string',
      allowNull: true,
      columnName: 'publication_fascicule_bbs_old',
      maxLength: 300,
    },

    authorComment: {
      type: 'string',
      allowNull: true,
      maxLength: 300,
      columnName: 'author_comment',
    },
  },
};
