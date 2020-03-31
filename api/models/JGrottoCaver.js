/**
 * JGrottoCaver.js
 *
 * @description :: jGrottoCaver model imported from localhost MySql server at 04/12/2018 11:28:57.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_grotto_caver',

  attributes: {
    grotto: {
      columnName: 'Id_grotto',
      model: 'TGrotto',
    },

    caver: {
      columnName: 'Id_caver',
      model: 'TCaver',
    },
  },
};
