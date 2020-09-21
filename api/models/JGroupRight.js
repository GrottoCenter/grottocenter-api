/**
 * JGroupRight.js
 *
 * @description :: jGroupRight model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_group_right',

  attributes: {
    group: {
      columnName: 'id_group',
      model: 'TGroup',
    },

    right: {
      columnName: 'id_right',
      model: 'TRight',
    },
  },
};
