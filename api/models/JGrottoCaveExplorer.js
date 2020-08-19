/**
 * JGrottoCaveExplorer.js
 *
 * @description :: jGrottoCaverExplorer model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_grotto_cave_explorer',

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
