/**
 * TFile.js
 *
 * @description :: tFile model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_file',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
      columnName: 'id',
      unique: true,
    },

    dateInscription: {
      type: 'ref',
      allowNull: false,
      columnName: 'date_inscription',
      columnType: 'timestamp',
    },

    dateReviewed: {
      type: 'ref',
      columnName: 'date_reviewed',
      columnType: 'timestamp',
    },

    fileName: {
      type: 'string',
      allowNull: false,
      maxLength: 200,
      columnName: 'filename',
    },

    path: {
      type: 'string',
      allowNull: true,
      columnName: 'path',
      maxLength: 1000,
    },

    fileFormat: {
      allowNull: false,
      columnName: 'id_file_format',
      model: 'TFileFormat',
    },

    isValidated: {
      type: 'boolean',
      columnName: 'is_validated',
      allowNull: false,
    },

    document: {
      allowNull: false,
      columnName: 'id_document',
      model: 'TDocument',
    },
  },
};
