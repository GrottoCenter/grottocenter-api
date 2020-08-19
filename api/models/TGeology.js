/**
 * TGeology.js
 *
 * @description :: tGeology model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_geology',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
      columnName: 'id',
      unique: true,
    },

    label: {
      type: 'string',
      allowNull: false,
      columnName: 'label',
      maxLength: 500,
    },

    parent: {
      columnName: 'id_parent',
      model: 'TGeology',
    },
  },
};
