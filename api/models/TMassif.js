/**
 * TMassif.js
 *
 * @description :: tMassif model imported from localhost MySql server at 03/12/2018 15:22:13.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
'use strict';
module.exports = {

  tableName: 't_massif',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      unique: true,
      autoIncrement: true,
      columnName: 'Id'
    },
    author: {
      columnName: 'Id_author',
      model: 'TCaver'
    },
    idReviewer: {
      type: 'number',
      autoMigrations: { index: true },
      columnName: 'Id_reviewer'
    },
    name: {
      type: 'string',
      maxLength: 36,
      columnName: 'Name'
    },
    dateInscription: {
      type: 'string',
      columnType: 'datetime',
      columnName: 'Date_inscription'
    },
    dateReviewed: {
      type: 'string',
      columnType: 'datetime',
      columnName: 'Date_reviewed'
    },
    caves: {
      collection: 'TCave',
      via: 'massif',
      through: 'JMassifCave'
    },
    entries: {
      collection: 'TEntry',
      via: 'massif',
      through: 'JMassifCave'
    },
  }
};
