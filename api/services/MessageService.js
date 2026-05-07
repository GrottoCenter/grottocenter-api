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

    // Eligible Recipient criteria:
    // - Not banned
    // - Has a password (not a Non_User_Caver)
    // - mail_is_valid OR NOT activated
    if (
      caver.banned ||
      !caver.password ||
      (caver.activated && !caver.mailIsValid)
    ) {
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
        last_m.id as "lastMessageId",
        other_p.id_caver as "otherParticipantId",
        other_c.nickname as "otherParticipantNickname"
      FROM t_conversation c
      JOIN j_participant my_p ON c.id = my_p.id_conversation
      JOIN j_participant other_p ON c.id = other_p.id_conversation AND other_p.id_caver != $1
      LEFT JOIN t_caver other_c ON other_p.id_caver = other_c.id
      LEFT JOIN LATERAL (
        SELECT id, date_sent, body 
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
      ORDER BY (CASE WHEN $2 = 'archived' THEN my_p.archived_at ELSE last_m.date_sent END) DESC NULLS LAST
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
      lastMessage: row.lastMessageId
        ? {
            id: row.lastMessageId,
            body: row.lastMessageBody,
            dateSent: row.lastMessageDate,
          }
        : null,
      unreadCount: parseInt(row.unreadCount, 10),
      otherParticipant: module.exports.formatParticipant({
        id: row.otherParticipantId,
        nickname: row.otherParticipantNickname,
      }),
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
   * @param {number} readerId - Required. Marks messages as read for this participant.
   * @returns {Promise<Array>}
   */
  getMessages: async (conversationId, skip, limit, readerId) => {
    if (!readerId) {
      throw new Error('readerId is required to fetch messages');
    }

    await module.exports.markAsRead(conversationId, readerId);

    const messages = await TMessage.find({ conversation: conversationId })
      .skip(skip)
      .limit(limit)
      .sort('dateSent ASC')
      .populate('caverSender');

    return messages.map((m) => module.exports.formatMessage(m));
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
    await JParticipant.update({
      conversation: conversationId,
      caver: readerId,
    }).set({ state: 'active', archivedAt: null });

    await TMessage.update({
      conversation: conversationId,
      caverSender: { '!=': readerId },
      dateRead: null,
    }).set({
      dateRead: new Date(),
    });
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

  /**
   * Get the ID of the other participant in a 1-on-1 conversation.
   * @param {number} conversationId
   * @param {number} caverId - The ID of the participant to exclude.
   * @returns {Promise<number|null>}
   */
  getOtherParticipantId: async (conversationId, caverId) => {
    const result = await CommonService.query(
      'SELECT id_caver FROM j_participant WHERE id_conversation = $1 AND id_caver != $2',
      [conversationId, caverId]
    );
    return result.rows.length > 0 ? result.rows[0].id_caver : null;
  },

  /**
   * Get unread message counts for both active and archived conversations.
   * @param {number} caverId
   * @returns {Promise<Object>} { active, archived }
   */
  getUnreadCounts: async (caverId) => {
    const query = `
      SELECT 
        p.state,
        COUNT(m.id)::int as count
      FROM j_participant p
      JOIN t_message m ON p.id_conversation = m.id_conversation 
      WHERE p.id_caver = $1
        AND m.id_caver_sender != $1 
        AND m.date_read IS NULL
      GROUP BY p.state
    `;
    const result = await CommonService.query(query, [caverId]);
    const counts = { active: 0, archived: 0 };
    result.rows.forEach((row) => {
      counts[row.state] = row.count;
    });
    return counts;
  },

  /**
   * Format a participant for API response (strips PII).
   * @param {object|number} participant
   * @returns {object|number}
   */
  formatParticipant: (participant) => {
    if (!participant || typeof participant !== 'object') {
      return participant;
    }
    return {
      id: participant.id,
      nickname: participant.nickname || 'Deleted User',
    };
  },

  /**
   * Format a message for API response (strips PII).
   * @param {object} message
   * @returns {object}
   */
  formatMessage: (message) => {
    if (!message) return null;
    return {
      id: message.id,
      body: message.body,
      dateSent: message.dateSent,
      dateRead: message.dateRead,
      conversation: message.conversation,
      caverSender: module.exports.formatParticipant(message.caverSender),
    };
  },
};
