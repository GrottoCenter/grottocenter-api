/**
 * TCave.js
 *
 * @description :: tCave model imported from localhost MySql server at 31/3/2016 12:7:32.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_cave',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      unique: true,
      autoIncrement: true,
      columnName: 'Id',
    },

    locked: {
      type: 'string',
      defaultsTo: 'NO',
      columnName: 'Locked',
    },

    author: {
      columnName: 'Id_author',
      model: 'TCaver',
    },

    idReviewer: {
      type: 'number',
      autoMigrations: { index: true },
      columnName: 'Id_reviewer',
      allowNull: true,
    },

    idLocker: {
      type: 'number',
      columnName: 'Id_locker',
      allowNull: true,
    },

    name: {
      type: 'string',
      maxLength: 36,
      columnName: 'Name',
    },

    minDepth: {
      type: 'number',
      columnName: 'Min_depth',
      allowNull: true,
    },

    maxDepth: {
      type: 'number',
      columnName: 'Max_depth',
      allowNull: true,
    },

    depth: {
      type: 'number',
      columnName: 'Depth',
      allowNull: true,
    },

    length: {
      type: 'number',
      columnName: 'Length',
      allowNull: true,
    },

    isDiving: {
      type: 'string',
      defaultsTo: 'NO',
      columnName: 'Is_diving',
    },

    temperature: {
      type: 'number',
      columnName: 'Temperature',
      allowNull: true,
    },

    dateInscription: {
      type: 'ref',
      columnType: 'datetime',
      columnName: 'Date_inscription',
    },

    dateReviewed: {
      type: 'ref',
      columnType: 'datetime',
      columnName: 'Date_reviewed',
    },

    dateLocked: {
      type: 'ref',
      columnType: 'datetime',
      columnName: 'Date_locked',
    },

    entries: {
      collection: 'TEntry',
      via: 'cave',
    },
    massifs: {
      collection: 'TMassif',
      via: 'cave',
      through: 'JMassifCave',
    },

    topographies: {
      collection: 'TTopography',
      via: 'idCave',
      through: 'jtopocave',
    },
  },
};
