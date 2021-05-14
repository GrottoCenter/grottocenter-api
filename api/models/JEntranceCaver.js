/**
 * JEntranceCaver.js
 *
 * @description :: jEntranceCaver model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_entrance_caver',

  attributes: {
    caver: {
      columnName: 'id_caver',
      model: 'TCaver',
    },

    entrance: {
      columnName: 'id_entrance',
      model: 'TEntrance',
    },
  },
};
