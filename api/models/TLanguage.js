/**
 * TLanguage.js
 *
 * @description :: tLanguage model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_language',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'string',
      columnName: 'id',
      required: true,
      unique: true,
    },

    part2b: {
      type: 'string',
      columnName: 'part2b',
      maxLength: 3,
    },

    part2t: {
      type: 'string',
      columnName: 'part2t',
      maxLength: 3,
    },

    part1: {
      type: 'string',
      columnName: 'part1',
      maxLength: 2,
    },

    scope: {
      type: 'string',
      allowNull: false,
      columnName: 'scope',
      maxLength: 1,
    },

    type: {
      type: 'string',
      allowNull: false,
      columnName: 'type',
      maxLength: 1,
    },

    refName: {
      type: 'string',
      allowNull: false,
      columnName: 'ref_name',
      maxLength: 150,
    },

    comment: {
      type: 'string',
      columnName: 'comment',
      maxLength: 150,
    },
  },
};
