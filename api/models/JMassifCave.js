/**
 * JMassifCave.js
 *
 * @description :: JMassifCave model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_massif_cave',

  attributes: {
    massif: {
      columnName: 'id_massif',
      model: 'TMassif',
    },

    cave: {
      columnName: 'id_cave',
      model: 'TCave',
    },
  },
};
