/**
 * TFile.js
 *
 * @description :: tFile model imported from localhost MySql server at 4/3/2016 23:47:21.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */


module.exports = {

  tableName: 't_file',

  attributes: {
    id: {
      type: 'integer',
      unique: true,
      primaryKey: true,
      autoIncrement: true,
      columnName: 'Id'
    },

    fileauthor: {
      type: 'integer',
      columnName: 'Id_author',
      model: 'TAuthor',
      via: 'id'
    },

    dateInscription: {
      type: 'datetime',
      columnName: 'Date_inscription'
    },

    name: {
      type: 'string',
      size: 100,
      columnName: 'Name'
    },

    path: {
      type: 'string',
      size: 1000,
      columnName: 'Path'
    },

    topographies: {
      collection: 'TTopography',
      via: 'idTopography',
      through: 'jtopofile'
    }
  }
};
