/**
 * JParticipant.js
 *
 * @description :: jParticipant model — pure junction table linking cavers to conversations.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_participant',
  // WARNING: This table uses a composite primary key (id_conversation, id_caver) in SQL.
  // Waterline does not support composite primary keys and will try to inject a default 'id' column.
  // In tests (migrate: 'drop'), a phantom 'id' column will be created.
  // In production (migrate: 'safe'), there is NO 'id' column.
  // DO NOT use Waterline methods (find, update, etc.) on this model; use raw SQL instead.
  primaryKey: 'conversation',

  attributes: {
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
  },
};
