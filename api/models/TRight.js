/**
 * TRight.js
 *
 * @description :: tRight model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_right',

  attributes: {
    id: {
      type: 'number',
      allowNull: false,
      autoIncrement: true,
      columnName: 'id',
      unique: true,
    },

    name: {
      type: 'string',
      allowNull: false,
      columnName: 'name',
      maxLength: 200,
    },

    comments: {
      type: 'string',
      allowNull: true,
      columnName: 'comments',
      maxLength: 1000,
    },

    groups: {
      collection: 'TGroup',
      via: 'right',
      through: 'JGroupRight',
    },
  },
};
