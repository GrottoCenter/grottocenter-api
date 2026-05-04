/**
 * TConversation.js
 *
 * @description :: tConversation model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_conversation',

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
      columnName: 'date_inscription',
      columnType: 'timestamp',
      defaultsTo: 'now()',
    },

    participants: {
      collection: 'JParticipant',
      via: 'conversation',
    },

    messages: {
      collection: 'TMessage',
      via: 'conversation',
    },
  },
};
