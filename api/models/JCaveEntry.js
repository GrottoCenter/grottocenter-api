/**
 * JCaveEntry.js
 *
 * @description :: jCaveEntry model imported from localhost MySql server at 31/3/2016 12:7:32.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */


module.exports = {

  tableName: 'j_cave_entry',

  attributes: {
    caves: {
      type: 'integer',
      unique: true,
      primaryKey: true,
      columnName: 'Id_cave',
      model: 'TCave'
    },

    entries: {
      type: 'integer',
      unique: true,
      primaryKey: true,
      columnName: 'Id_entry',
      model: 'TEntry'
    }
  }
};
