/**
 * JTopoCave.js
 *
 * @description :: jTopoCave model imported from localhost MySql server at 15/11/2016 19:18:1.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */


module.exports = {

  tableName: 'j_topo_cave',

  attributes: {
    idTopography: {
      type: 'integer',
      columnName: 'Id_topography',
      model: 'TTopography'
    },
    idCave: {
      type: 'integer',
      columnName: 'Id_cave',
      model: 'TCave'
    }
  }
};
