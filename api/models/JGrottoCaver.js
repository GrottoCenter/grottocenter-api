/**
 * JGrottoCaver.js
 *
 * @description :: jGrottoCaver model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_grotto_caver',

  attributes: {
    grotto: {
      columnName: 'id_grotto',
      model: 'TGrotto',
    },

    caver: {
      columnName: 'id_caver',
      model: 'TCaver',
    },
  },
};
