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
};
