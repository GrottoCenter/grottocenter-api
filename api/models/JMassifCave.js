/**
 * JMassifCave.js
 *
 * @description :: jMassifCave model imported from localhost MySql server at 03/12/2018 15:27:30.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
'use strict';

module.exports = {

  tableName: 'j_massif_cave',

  attributes: {
    cave: {
      columnName: 'Id_cave',
      model: 'TCave'
    },
    massif: {
      columnName: 'Id_massif',
      model: 'TMassif'
    },
    entry: {
      columnName: 'Id_entry',
      model: 'TEntry'
    }
  }
};
