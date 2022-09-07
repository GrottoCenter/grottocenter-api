/**
 * TNotification.js
 *
 * @description :: tNotification model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_notification',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
      columnName: 'id',
      unique: true,
    },

    dateInscription: {
      type: 'ref',
      allowNull: false,
      columnType: 'timestamp',
      columnName: 'date_inscription',
    },

    dateReadAt: {
      type: 'ref',
      columnType: 'timestamp',
      columnName: 'date_read_at',
    },

    notified: {
      allowNull: false,
      columnName: 'id_notified',
      model: 'TCaver',
    },

    notifier: {
      allowNull: false,
      columnName: 'id_notifier',
      model: 'TCaver',
    },

    notificationType: {
      allowNull: false,
      columnName: 'id_notification_type',
      model: 'TNotificationType',
    },

    cave: {
      columnName: 'id_cave',
      model: 'TCave',
    },

    description: {
      columnName: 'id_description',
      model: 'TDescription',
    },

    document: {
      columnName: 'id_document',
      model: 'TDocument',
    },

    entrance: {
      columnName: 'id_entrance',
      model: 'TEntrance',
    },

    grotto: {
      columnName: 'id_grotto',
      model: 'TGrotto',
    },

    location: {
      columnName: 'id_location',
      model: 'TLocation',
    },

    massif: {
      columnName: 'id_massif',
      model: 'TMassif',
    },
  },
};
