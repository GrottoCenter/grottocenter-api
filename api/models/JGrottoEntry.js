/**
 * JGrottoEntry.js
 *
 * @description :: jGrottoEntry model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_grotto_cave_explorer',

  attributes: {
    grotto: {
      columnName: 'id_grotto',
      model: 'TGrotto',
    },

    entry: {
      columnName: 'id_cave',
      model: 'TCave',
    },
  },
};
