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
      type: 'ref',
      columnName: 'date_inscription',
      columnType: 'datetime',
    },

    dateValidation: {
      type: 'ref',
      columnName: 'date_validation',
      columnType: 'datetime',
    },

    datePublication: {
      type: 'string',
      columnName: 'date_publication',
      allowNull: true,
      maxLength: 10,
    },

    dateReviewed: {
      type: 'ref',
      columnName: 'date_reviewed',
      columnType: 'datetime',
    },

    isValidated: {
      type: 'boolean',
      allowNull: false,
      columnName: 'is_validated',
      defaultsTo: false,
    },

    issue: {
      type: 'string',
      allowNull: true,
      maxLength: 100,
    },

    validationComment: {
      type: 'string',
      allowNull: true,
      maxLength: 300,
      columnName: 'validation_comment',
    },

    authorComment: {
      type: 'string',
      allowNull: true,
      maxLength: 300,
      columnName: 'author_comment',
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

    authorsGrotto: {
      collection: 'TGrotto',
      via: 'document',
      through: 'JDocumentGrottoAuthor',
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

    children: {
      collection: 'TDocument',
      via: 'parent',
    },

    license: {
      allowNull: false,
      columnName: 'id_license',
      model: 'TLicense',
    },

    modifiedDocJson: {
      columnName: 'modified_doc_json',
      type: 'json',
    },

    idDbImport: {
      type: 'number',
      columnName: 'id_db_import',
    },

    nameDbImport: {
      type: 'string',
      columnName: 'name_db_import',
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

    files: {
      collection: 'TFile',
      via: 'document',
    },

    authors: {
      collection: 'TCaver',
      via: 'document',
      through: 'JDocumentCaverAuthor',
    },

    regions: {
      collection: 'TRegion',
      via: 'document',
      through: 'JDocumentRegion',
    },

    subjects: {
      collection: 'TSubject',
      via: 'document',
      through: 'JDocumentSubject',
    },

    descriptions: {
      collection: 'TDescription',
      via: 'document',
    },

    languages: {
      collection: 'TLanguage',
      via: 'document',
      through: 'JDocumentLanguage',
    },
  },
};
