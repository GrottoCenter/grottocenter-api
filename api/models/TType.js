/**
 * TType.js
 *
 * @description :: tType model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_type',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
      columnName: 'id',
      unique: true,
    },

    name: {
      type: 'string',
      allowNull: false,
      columnName: 'name',
      maxLength: 30,
    },

    comment: {
      type: 'string',
      allowNull: false,
      columnName: 'comment',
      maxLength: 500,
    },

    parent: {
      columnName: 'id_parent',
      model: 'TType',
    },
  },
};
