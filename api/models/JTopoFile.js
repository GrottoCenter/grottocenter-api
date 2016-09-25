/**
* JTopoFile.js
*
* @description :: jTopoFile model imported from localhost MySql server at 31/3/2016 12:7:32.
* @docs        :: http://sailsjs.org/#!documentation/models
*/


module.exports = {

  tableName: 'j_topo_file',

  attributes: {
    idTopography : {
      type: 'integer',
      unique: true,
      primaryKey: true,
      columnName: 'Id_topography',
	  model: 'TTopography'
    },
	
    idFile : {
      type: 'integer',
      unique: true,
      primaryKey: true,
      columnName: 'Id_file',
	  model: 'TFile'
    }
  }
};
