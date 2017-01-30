/**
* JTopoEntry.js
*
* @description :: jTopoEntry model imported from localhost MySql server at 15/11/2016 19:18:6.
* @docs        :: http://sailsjs.org/#!documentation/models
*/
'use strict';

module.exports = {

  tableName: 'j_topo_entry',

  attributes: {
    idTopography : {
      type: 'integer',
      columnName: 'Id_topography',
      model: 'TTopography'
    },
    idEntry : {
      type: 'integer',
      columnName: 'Id_entry',
      model: 'TEntry'
    }
  }
};
