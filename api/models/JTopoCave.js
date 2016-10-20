/**
 * JTopoCave.js
 *
 * @description :: jTopoCave model imported from localhost MySql server at 31/3/2016 12:7:32.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */


module.exports = {

  tableName: 'j_topo_cave',

  attributes: {
    idTopography: {
      type: 'integer',
      unique: true,
      primaryKey: true,
      columnName: 'Id_topography',
      model: 'TTopography'
    },

    idCave: {
      type: 'integer',
      unique: true,
      primaryKey: true,
      columnName: 'Id_cave',
      model: 'TCave'
    },

    idEntry: {
      type: 'integer',
      unique: true,
      primaryKey: true,
      columnName: 'Id_entry',
      model: 'TEntry'
    }
  }
};
