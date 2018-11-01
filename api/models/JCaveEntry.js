/**
 * JCaveEntry.js
 *
 * @description :: jCaveEntry model imported from localhost MySql server at 31/3/2016 12:7:32.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
'use strict';

module.exports = {

  tableName: 'j_cave_entry',

  attributes: {
    cave: {
      columnName: 'Id_cave',
      model: 'TCave'
    },

    entry: {
      columnName: 'Id_entry',
      model: 'TEntry'
    }
  }
};
