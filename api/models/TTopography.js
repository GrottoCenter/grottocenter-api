/**
 * TTopography.js
 *
 * @description :: tTopography model imported from localhost MySql server at 31/3/2016 12:7:32.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  tableName: 't_topography',

  attributes: {
    id: {
      type: 'integer',
      unique: true,
      primaryKey: true,
      autoIncrement: true,
      columnName: 'Id'
    },

    idAuthor: {
      type: 'integer',
      columnName: 'Id_author'
    },

    dateInscription: {
      type: 'datetime',
      columnName: 'Date_inscription'
    },

    idRequest: {
      type: 'integer',
      columnName: 'Id_request'
    },

    isPublic: {
      type: 'text',
      required: true,
      defaultsTo: 'YES',
      columnName: 'Is_public'
    },

    removeNorth: {
      type: 'text',
      required: true,
      defaultsTo: 'NO',
      columnName: 'Remove_north'
    },

    removeScale: {
      type: 'text',
      required: true,
      defaultsTo: 'NO',
      columnName: 'Remove_scale'
    },

    distortTopo: {
      type: 'text',
      required: true,
      defaultsTo: 'NO',
      columnName: 'Distort_topo'
    },

    enabled: {
      type: 'text',
      required: true,
      defaultsTo: 'NO',
      columnName: 'Enabled'
    },

    enabledBack: {
      type: 'text',
      required: true,
      defaultsTo: 'NO',
      columnName: 'Enabled_back'
    },

    files: {
      collection: 'TFile',
      via: 'idFile',
      through: 'jtopofile'
    }
  }
};
