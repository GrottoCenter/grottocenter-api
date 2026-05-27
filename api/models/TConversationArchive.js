/**
 * TConversationArchive.js
 *
 * @description :: Records which cavers have archived which conversations.
 *                 Archive = row exists; unarchive = row destroyed.
 *                 Separated from j_participant to keep that table a pure link table
 *                 and to give this model a proper serial PK that Waterline can use.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_conversation_archive',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
      columnName: 'id',
    },

    conversation: {
      columnName: 'id_conversation',
      model: 'TConversation',
      required: true,
    },

    caver: {
      columnName: 'id_caver',
      model: 'TCaver',
      required: true,
    },

    archivedAt: {
      type: 'ref',
      columnName: 'archived_at',
      columnType: 'timestamp',
    },
  },
};
