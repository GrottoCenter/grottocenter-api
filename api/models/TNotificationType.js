/**
 * TNotificationType.js
 *
 * @description :: tNotificationType model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_notification_type',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      columnName: 'id',
      required: true,
    },

    name: {
      type: 'string',
      allowNull: false,
      columnName: 'name',
      maxLength: 50,
    },
  },
};
