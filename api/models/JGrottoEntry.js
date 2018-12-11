/**
 * JGrottoEntry.js
 *
 * @description :: jGrottoEntry model imported from localhost MySql server at 04/12/2018 11:28:57.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
'use strict';

module.exports = {

  tableName: 'j_grotto_entry',

  attributes: {
    grotto: {
      columnName: 'Id_grotto',
      model: 'TGrotto'
    },

    entry: {
      columnName: 'Id_entry',
      model: 'TEntry'
    }
  }
};
