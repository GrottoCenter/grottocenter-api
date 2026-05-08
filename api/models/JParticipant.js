/**
 * JParticipant.js
 *
 * @description :: jParticipant model — pure junction table linking cavers to conversations.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_participant',

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
