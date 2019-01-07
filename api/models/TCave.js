/**
 * TCave.js
 *
 * @description :: tCave model imported from localhost MySql server at 31/3/2016 12:7:32.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
'use strict';

module.exports = {

  tableName: 't_cave',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      unique: true,
      autoIncrement: true,
      columnName: 'Id'
    },

    locked: {
      type: 'string',
      defaultsTo: 'NO',
      columnName: 'Locked'
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

    idLocker: {
      type: 'number',
      columnName: 'Id_locker'
    },

    name: {
      type: 'string',
      maxLength: 36,
      columnName: 'Name'
    },

    minDepth: {
      type: 'number',
      columnName: 'Min_depth'
    },

    maxDepth: {
      type: 'number',
      columnName: 'Max_depth'
    },

    depth: {
      type: 'number',
      columnName: 'Depth'
    },

    length: {
      type: 'number',
      columnName: 'Length'
    },

    isDiving: {
      type: 'string',
      defaultsTo: 'NO',
      columnName: 'Is_diving'
    },

    temperature: {
      type: 'number',
      columnName: 'Temperature'
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

    dateLocked: {
      type: 'string',
      columnType: 'datetime',
      columnName: 'Date_locked'
    },

    entries: {
      collection: 'TEntry',
      via: 'cave'
    },
    massifs: {
      collection: 'TMassif',
      via: 'cave',
      through: 'JMassifCave'
    },

    topographies: {
      collection: 'TTopography',
      via: 'idCave',
      through: 'jtopocave'
    }
  }
};
