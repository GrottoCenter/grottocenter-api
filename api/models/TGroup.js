/**
 * TGroup.js
 *
 * @description :: tGroup model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_group',

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

    cavers: {
      collection: 'TCaver',
      via: 'group',
      through: 'JCaverGroup',
    },
  },
};
