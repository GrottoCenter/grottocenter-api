/**
 * VCaverRoles.js
 *
 * @description :: VCaverRoles model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'v_caver_roles',

  attributes: {
    id: {
      type: 'number',
      allowNull: false,
      columnName: 'caver_id',
      required: true,
    },

    nickname: {
      type: 'string',
      allowNull: true,
      columnName: 'nickname',
    },

    name: {
      type: 'string',
      allowNull: true,
      columnName: 'name',
    },

    surname: {
      type: 'string',
      allowNull: true,
      columnName: 'surname',
    },

    isUser: {
      type: 'boolean',
      columnName: 'is_user',
      defaultsTo: false,
    },

    isAuthor: {
      type: 'boolean',
      columnName: 'is_author',
      defaultsTo: false,
    },

    isContributor: {
      type: 'boolean',
      columnName: 'is_contributor',
      defaultsTo: false,
    },
  },
};
