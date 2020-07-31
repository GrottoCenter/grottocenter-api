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
      type: 'string',
      allowNull: false,
      columnName: 'date_inscription',
      columnType: 'datetime',
      defaultsTo: '2000-01-01 00:00:00',
    },

    dateReviewed: {
      type: 'string',
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
