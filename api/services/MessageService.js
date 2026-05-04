const CommonService = require('./CommonService');

/**
 * MessageService.js
 *
 * @description :: Message service
 */

module.exports = {
  /**
   * Find an existing private conversation between two cavers.
   * @param {number} caver1Id
   * @param {number} caver2Id
   * @returns {Promise<number|null>}
   */
  findExistingConversation: async (caver1Id, caver2Id) => {
    const query = `
      SELECT id_conversation 
      FROM j_participant 
      WHERE id_conversation IN (
        SELECT id_conversation FROM j_participant WHERE id_caver = $1
      )
      AND id_caver = $2
      LIMIT 1
    `;
    const result = await CommonService.query(query, [caver1Id, caver2Id]);
    return result.rows.length > 0 ? result.rows[0].id_conversation : null;
  },

  /**
   * Create a new conversation between two cavers.
   * @param {number} caver1Id
   * @param {number} caver2Id
   * @returns {Promise<Object>}
   */
  createConversation: async (caver1Id, caver2Id) =>
    sails.getDatastore().transaction(async (db) => {
      const newConvo = await TConversation.create({
        dateInscription: new Date(),
      })
        .usingConnection(db)
        .fetch();

      await CommonService.query(
        'INSERT INTO j_participant (id_conversation, id_caver, state) VALUES ($1, $2, $3), ($4, $5, $6)',
        [newConvo.id, caver1Id, 'active', newConvo.id, caver2Id, 'active'],
        db
      );

      return newConvo;
    }),

  /**
   * Check if a caver is an eligible recipient for private messaging.
   * @param {number} caverId
   * @throws {Error} with code E_NOT_FOUND or E_FORBIDDEN
   * @returns {Promise<Object>} The caver
   */
  getEligibleRecipient: async (caverId) => {
    const caver = await TCaver.findOne({ id: caverId });

    if (!caver) {
      const error = new Error('Recipient not found');
      error.code = 'E_NOT_FOUND';
      throw error;
    }

    // Eligible Registered User criteria:
    // - Not banned
    // - Activated
    // - Has a login (not a Non_User_Caver)
    if (caver.banned || !caver.activated || !caver.login) {
      const error = new Error(
        'Recipient is not eligible for private messaging'
      );
      error.code = 'E_FORBIDDEN';
      throw error;
    }

    return caver;
  },

  /**
   * List conversations for a caver.
   * @param {number} caverId
   * @param {'active'|'archived'} state
   * @param {number} skip
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  listConversations: async (caverId, state, skip, limit) => {
    const query = `
      SELECT 
        c.id, 
        c.date_inscription as "dateInscription",
        last_m.date_sent as "lastMessageDate",
        last_m.body as "lastMessageBody",
        COALESCE(u.unread_count, 0)::int as "unreadCount",
        other_p.id_caver as "otherParticipantId",
        other_c.nickname as "otherParticipantNickname"
      FROM t_conversation c
      JOIN j_participant my_p ON c.id = my_p.id_conversation
      JOIN j_participant other_p ON c.id = other_p.id_conversation AND other_p.id_caver != $1
      LEFT JOIN t_caver other_c ON other_p.id_caver = other_c.id
      LEFT JOIN LATERAL (
        SELECT date_sent, body 
        FROM t_message 
        WHERE id_conversation = c.id 
        ORDER BY date_sent DESC 
        LIMIT 1
      ) last_m ON TRUE
      LEFT JOIN (
        SELECT id_conversation, COUNT(*) as unread_count
        FROM t_message
        WHERE id_caver_sender != $1 AND date_read IS NULL
        GROUP BY id_conversation
      ) u ON c.id = u.id_conversation
      WHERE my_p.id_caver = $1 AND my_p.state = $2
      ORDER BY "lastMessageDate" DESC NULLS LAST
      LIMIT $3 OFFSET $4
    `;
    const result = await CommonService.query(query, [
      caverId,
      state,
      limit,
      skip,
    ]);
    return result.rows.map((row) => ({
      id: row.id,
      dateInscription: row.dateInscription,
      lastMessage: {
        dateSent: row.lastMessageDate,
        body: row.lastMessageBody,
      },
      unreadCount: row.unreadCount,
      otherParticipant: {
        id: row.otherParticipantId,
        nickname: row.otherParticipantNickname || 'Deleted User',
      },
    }));
  },

  /**
   * Count conversations for a caver.
   * @param {number} caverId
   * @param {'active'|'archived'} state
   * @returns {Promise<number>}
   */
  countConversations: async (caverId, state) => {
    const query = `
      SELECT COUNT(*)
      FROM j_participant
      WHERE id_caver = $1 AND state = $2
    `;
    const result = await CommonService.query(query, [caverId, state]);
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Get messages in a conversation.
   * @param {number} conversationId
   * @param {number} skip
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  getMessages: async (conversationId, skip, limit) => {
    const messages = await TMessage.find({ conversation: conversationId })
      .skip(skip)
      .limit(limit)
      .sort('dateSent ASC')
      .populate('caverSender');

    return messages.map((m) => ({
      id: m.id,
      body: m.body,
      dateSent: m.dateSent,
      dateRead: m.dateRead,
      caverSender: m.caverSender
        ? {
            id: m.caverSender.id,
            nickname: m.caverSender.nickname,
          }
        : {
            id: null,
            nickname: 'Deleted User',
          },
    }));
  },

  /**
   * Count messages in a conversation.
   * @param {number} conversationId
   * @returns {Promise<number>}
   */
  countMessages: async (conversationId) =>
    TMessage.count({ conversation: conversationId }),

  /**
   * Mark unread messages from other participants as read.
   * @param {number} conversationId
   * @param {number} readerId
   * @returns {Promise<void>}
   */
  markAsRead: async (conversationId, readerId) => {
    const query = `
      UPDATE t_message 
      SET date_read = NOW() 
      WHERE id_conversation = $1 
        AND id_caver_sender != $2 
        AND date_read IS NULL
    `;
    await CommonService.query(query, [conversationId, readerId]);
  },

  /**
   * Check if a caver is a participant in a conversation.
   * @param {number} conversationId
   * @param {number} caverId
   * @returns {Promise<boolean>}
   */
  isParticipant: async (conversationId, caverId) => {
    const result = await CommonService.query(
      'SELECT 1 FROM j_participant WHERE id_conversation = $1 AND id_caver = $2',
      [conversationId, caverId]
    );
    return result.rows.length > 0;
  },
};
