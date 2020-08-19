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
      columnType: 'datetime',
    },

    dateReviewed: {
      type: 'ref',
      columnName: 'date_reviewed',
      columnType: 'datetime',
    },

    fileName: {
      type: 'string',
      allowNull: false,
      maxLength: 200,
      columnName: 'filename',
    },

    fileFormat: {
      allowNull: false,
      columnName: 'id_file_format',
      model: 'TFileFormat',
    },

    document: {
      allowNull: false,
      columnName: 'id_document',
      model: 'TDocument',
    },
  },
};
