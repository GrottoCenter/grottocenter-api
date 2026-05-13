/**
 * TMessage.js
 *
 * @description :: tMessage model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_message',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
      columnName: 'id',
      unique: true,
    },

    conversation: {
      columnName: 'id_conversation',
      model: 'TConversation',
      required: true,
    },

    caverSender: {
      columnName: 'id_caver_sender',
      model: 'TCaver',
      allowNull: true,
    },

    body: {
      type: 'string',
      columnName: 'body',
      allowNull: false,
      maxLength: 5000,
    },

    dateSent: {
      type: 'ref',
      columnName: 'date_sent',
      columnType: 'timestamp',
      defaultsTo: 'now()',
    },

    dateRead: {
      type: 'ref',
      columnName: 'date_read',
      columnType: 'timestamp',
    },
  },
};
