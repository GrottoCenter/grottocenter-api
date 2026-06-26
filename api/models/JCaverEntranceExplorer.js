/**
 * JCaverEntranceExplorer.js
 *
 * @description :: jCaverEntranceExplorer model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_caver_entrance_explorer',

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
