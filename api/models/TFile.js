/**
 * TFile.js
 *
 * @description :: tFile model imported from localhost MySql server at 4/3/2016 23:47:21.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
'use strict';

module.exports = {

  tableName: 't_file',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      unique: true,
      autoIncrement: true,
      columnName: 'Id'
    },

    fileauthor: {
      columnName: 'Id_author',
      model: 'TAuthor',
      via: 'id'
    },

    dateInscription: {
      type: 'string',
      columnType: 'datetime',
      columnName: 'Date_inscription'
    },

    name: {
      type: 'string',
      maxLength: 100,
      columnName: 'Name'
    },

    path: {
      type: 'string',
      maxLength: 1000,
      columnName: 'Path'
    },

    topographies: {
      collection: 'TTopography',
      via: 'idFile',
      through: 'jtopofile'
    }
  }
};
