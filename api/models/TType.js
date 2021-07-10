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

    isAvailable: {
      type: 'boolean',
      allowNull: false,
      columnName: 'is_available',
      defaultsTo: false,
    },

    parent: {
      columnName: 'id_parent',
      model: 'TType',
    },
  },
};
