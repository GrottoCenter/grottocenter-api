/**
 * TTopography.js
 *
 * @description :: tTopography model imported from localhost MySql server at 31/3/2016 12:7:32.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_topography',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      unique: true,
      autoIncrement: true,
      columnName: 'Id',
    },

    author: {
      columnName: 'Id_author',
      model: 'TCaver',
    },

    dateInscription: {
      type: 'string',
      columnType: 'datetime',
      columnName: 'Date_inscription',
    },

    idRequest: {
      type: 'number',
      columnName: 'Id_request',
    },

    isPublic: {
      type: 'string',
      defaultsTo: 'YES',
      columnName: 'Is_public',
    },

    removeNorth: {
      type: 'string',
      defaultsTo: 'NO',
      columnName: 'Remove_north',
    },

    removeScale: {
      type: 'string',
      defaultsTo: 'NO',
      columnName: 'Remove_scale',
    },

    distortTopo: {
      type: 'string',
      defaultsTo: 'NO',
      columnName: 'Distort_topo',
    },

    enabled: {
      type: 'string',
      defaultsTo: 'NO',
      columnName: 'Enabled',
    },

    enabledBack: {
      type: 'string',
      defaultsTo: 'NO',
      columnName: 'Enabled_back',
    },

    files: {
      collection: 'TFile',
      via: 'idTopography',
      through: 'jtopofile',
    },

    caves: {
      collection: 'TCave',
      via: 'idTopography',
      through: 'jtopocave',
    },

    entries: {
      collection: 'TEntry',
      via: 'idTopography',
      through: 'jtopoentry',
    },
  },
};
