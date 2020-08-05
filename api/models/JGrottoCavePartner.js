/**
 * JGrottoCavePartner.js
 *
 * @description :: jGrottoCavePartner model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_grotto_cave_partner',

  attributes: {
    grotto: {
      columnName: 'id_grotto',
      model: 'TGrotto',
    },

    cave: {
      columnName: 'id_cave',
      model: 'TCave',
    },
  },
};
