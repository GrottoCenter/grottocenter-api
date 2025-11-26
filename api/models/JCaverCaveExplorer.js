/**
 * JCaverCaveExplorer.js
 *
 * @description :: jCaverCaveExplorer model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_caver_cave_explorer',

  attributes: {
    caver: {
      columnName: 'id_caver',
      model: 'TCaver',
    },

    cave: {
      columnName: 'id_cave',
      model: 'TCave',
    },
  },
};
