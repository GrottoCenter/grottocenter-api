const should = require('should');
const supertest = require('supertest');
const TokenService = require('../../../api/services/TokenService');
const MessageService = require('../../../api/services/MessageService');

describe('Messages features', () => {
  let sender;
  let recipient;
  let bannedRecipient;
  let nonUserRecipient;
  let senderToken;
  const manuallyCreatedConversationIds = [];

  const createEligibleUser = async (data = {}) =>
    TCaver.create({
      activated: true,
      mailIsValid: true,
      password: 'argon2_hashed_password_mock',
      language: 'eng',
      ...data,
    }).fetch();

  before(async () => {
    sender = await createEligibleUser({
      mail: 'sender@test.com',
      nickname: 'SenderUser',
      login: 'sender_login',
    });
    recipient = await createEligibleUser({
      mail: 'recipient@test.com',
      nickname: 'RecipientUser',
      login: 'recipient_login',
    });
    bannedRecipient = await createEligibleUser({
      mail: 'banned@test.com',
      nickname: 'BannedUser',
      login: 'banned_login',
      banned: true,
    });
    nonUserRecipient = await createEligibleUser({
      mail: 'nonuser@mail.no',
      nickname: 'NonUser',
      password: null,
      login: null,
    });

    senderToken = TokenService.issue({ id: sender.id }, 3600, 'auth');
  });

  after(async () => {
    // Find all conversations where any of the test cavers is a participant
    const participantsResult = await sails.sendNativeQuery(
      'SELECT DISTINCT id_conversation FROM j_participant WHERE id_caver = ANY($1)',
      [[sender.id, recipient.id, bannedRecipient.id, nonUserRecipient.id]]
    );
    const conversationIds = participantsResult.rows.map(
      (p) => p.id_conversation
    );
    conversationIds.push(...manuallyCreatedConversationIds);

    // Deduplicate and filter out falsy values
    const uniqueConversationIds = Array.from(
      new Set(conversationIds.filter((id) => id !== undefined && id !== null))
    );

    if (uniqueConversationIds.length > 0) {
      await TMessage.destroy({ conversation: uniqueConversationIds });
      await TConversationArchive.destroy({
        conversation: uniqueConversationIds,
      });
      await sails.sendNativeQuery(
        'DELETE FROM j_participant WHERE id_conversation = ANY($1)',
        [uniqueConversationIds]
      );
      await TConversation.destroy({ id: uniqueConversationIds });
    }

    await TCaver.destroy({
      id: [sender.id, recipient.id, bannedRecipient.id, nonUserRecipient.id],
    });
  });

  describe('POST /api/v1/messages', () => {
    describe('Validation', () => {
      it('should return 400 if body is empty', async () => {
        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/messages')
          .set('Authorization', `Bearer ${senderToken}`)
          .send({ recipientId: recipient.id, body: '' })
          .expect(400);

        should(res.body).have.properties([
          'code',
          'message',
          'metadata',
          'reference_id',
        ]);
        should(res.body.code).be.equal('E_VALIDATION');
      });

      it('should return 400 if body is whitespace only', async () => {
        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/messages')
          .set('Authorization', `Bearer ${senderToken}`)
          .send({ recipientId: recipient.id, body: '   ' })
          .expect(400);

        should(res.body.code).be.equal('E_VALIDATION');
      });

      it('should return 400 if body exceeds 5000 chars', async () => {
        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/messages')
          .set('Authorization', `Bearer ${senderToken}`)
          .send({ recipientId: recipient.id, body: 'a'.repeat(5001) })
          .expect(400);

        should(res.body.code).be.equal('E_VALIDATION');
      });

      it('should return 400 if sending to self', async () => {
        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/messages')
          .set('Authorization', `Bearer ${senderToken}`)
          .send({ recipientId: sender.id, body: 'Hello self' })
          .expect(400);

        should(res.body.code).be.equal('E_VALIDATION');
      });
    });

    describe('Eligibility', () => {
      it('should return 404 if recipient does not exist', async () => {
        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/messages')
          .set('Authorization', `Bearer ${senderToken}`)
          .send({ recipientId: 999999, body: 'Hello' })
          .expect(404);

        should(res.body.code).be.equal('E_NOT_FOUND');
      });

      it('should return 403 if recipient is banned', async () => {
        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/messages')
          .set('Authorization', `Bearer ${senderToken}`)
          .send({ recipientId: bannedRecipient.id, body: 'Hello banned' })
          .expect(403);

        should(res.body.code).be.equal('E_AUTHORIZATION');
      });

      it('should return 403 if recipient is non-user (no password)', async () => {
        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/messages')
          .set('Authorization', `Bearer ${senderToken}`)
          .send({ recipientId: nonUserRecipient.id, body: 'Hello non-user' })
          .expect(403);

        should(res.body.code).be.equal('E_AUTHORIZATION');
      });

      it('should allow sending to an unactivated user', async () => {
        const unactivatedRecipient = await createEligibleUser({
          mail: 'unactivated@test.com',
          nickname: 'UnactivatedUser',
          activated: false,
        });

        try {
          const res = await supertest(sails.hooks.http.app)
            .post('/api/v1/messages')
            .set('Authorization', `Bearer ${senderToken}`)
            .send({
              recipientId: unactivatedRecipient.id,
              body: 'Hello unactivated',
            })
            .expect(200);

          if (res.body && res.body.conversation) {
            manuallyCreatedConversationIds.push(res.body.conversation);
          }
        } finally {
          await TCaver.destroy({ id: unactivatedRecipient.id });
        }
      });

      it('should return 403 if recipient is activated but has invalid email', async () => {
        const invalidMailRecipient = await createEligibleUser({
          mail: 'invalidmail@test.com',
          nickname: 'InvalidMailUser',
          activated: true,
          mailIsValid: false,
        });

        try {
          const res = await supertest(sails.hooks.http.app)
            .post('/api/v1/messages')
            .set('Authorization', `Bearer ${senderToken}`)
            .send({
              recipientId: invalidMailRecipient.id,
              body: 'Hello invalid mail',
            })
            .expect(403);

          should(res.body.code).be.equal('E_AUTHORIZATION');
        } finally {
          await TCaver.destroy({ id: invalidMailRecipient.id });
        }
      });
    });

    describe('Functionality', () => {
      it('should create a new conversation and message on first contact', async () => {
        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/messages')
          .set('Authorization', `Bearer ${senderToken}`)
          .send({ recipientId: recipient.id, body: 'First message' })
          .expect(200);

        should(res.body).have.property('body', 'First message');
        should(res.body).have.property('conversation');
        const convoId = res.body.conversation;

        const participantsResult = await sails.sendNativeQuery(
          'SELECT id_caver FROM j_participant WHERE id_conversation = $1',
          [convoId]
        );
        const caverIds = participantsResult.rows.map((p) => p.id_caver);
        should(caverIds).have.length(2);
        should(caverIds).containEql(sender.id);
        should(caverIds).containEql(recipient.id);
      });

      it('should reuse existing conversation on second contact', async () => {
        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/messages')
          .set('Authorization', `Bearer ${senderToken}`)
          .send({ recipientId: recipient.id, body: 'Second message' })
          .expect(200);

        const convoId = res.body.conversation;
        const messages = await MessageService.getMessages(
          convoId,
          0,
          10,
          sender.id
        );
        should(messages.length).be.greaterThanOrEqual(2);
      });

      it('should allow replying using conversationId', async () => {
        // Create a fresh conversation for this test to avoid 404 from orphaned participants
        const tempRecipient = await createEligibleUser({
          mail: 'temp@test.com',
          nickname: 'TempUser',
        });
        const resSetup = await supertest(sails.hooks.http.app)
          .post('/api/v1/messages')
          .set('Authorization', `Bearer ${senderToken}`)
          .send({ recipientId: tempRecipient.id, body: 'Setup message' })
          .expect(200);

        const convoId = resSetup.body.conversation;
        if (convoId) {
          manuallyCreatedConversationIds.push(convoId);
        }

        try {
          const res = await supertest(sails.hooks.http.app)
            .post('/api/v1/messages')
            .set('Authorization', `Bearer ${senderToken}`)
            .send({ conversationId: convoId, body: 'Reply message' })
            .expect(200);

          should(res.body.conversation).be.equal(convoId);
        } finally {
          await TCaver.destroy({ id: tempRecipient.id });
        }
      });

      it('should return 403 if replying to a conversation not belonging to', async () => {
        const otherConvo = await TConversation.create({}).fetch();
        manuallyCreatedConversationIds.push(otherConvo.id);
        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/messages')
          .set('Authorization', `Bearer ${senderToken}`)
          .send({ conversationId: otherConvo.id, body: 'Intruder message' })
          .expect(403);

        should(res.body.code).be.equal('E_AUTHORIZATION');
      });

      it('should return 403 if replying to a conversation where the other participant is banned', async () => {
        const resConvo = await supertest(sails.hooks.http.app)
          .post('/api/v1/messages')
          .set('Authorization', `Bearer ${senderToken}`)
          .send({ recipientId: recipient.id, body: 'Initial message' })
          .expect(200);

        const convoId = resConvo.body.conversation;
        await TCaver.update({ id: recipient.id }).set({ banned: true });

        try {
          const resReply = await supertest(sails.hooks.http.app)
            .post('/api/v1/messages')
            .set('Authorization', `Bearer ${senderToken}`)
            .send({ conversationId: convoId, body: 'Reply to banned' })
            .expect(403);

          should(resReply.body.code).be.equal('E_AUTHORIZATION');
          should(resReply.body.message).be.equal(
            'You cannot send messages in this conversation'
          );
        } finally {
          await TCaver.update({ id: recipient.id }).set({ banned: false });
        }
      });
    });
  });

  describe('GET /api/v1/messages/conversations', () => {
    it('should return a paginated list of active conversations', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/messages/conversations')
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(206);

      should(res.body).have.property('conversations');
      should(res.body.conversations).be.an.Array();
      should(res.body.conversations.length).be.greaterThan(0);
      const convo = res.body.conversations[0];
      should(convo).have.properties([
        'id',
        'lastMessage',
        'unreadCount',
        'otherParticipant',
        'archivedAt',
      ]);
      should(convo.archivedAt).be.null();
      should(convo.otherParticipant).have.properties(['id', 'nickname']);
      should(convo.otherParticipant.nickname).be.equal('RecipientUser');
    });

    it('should cap limit at 50', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/messages/conversations?limit=100')
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(206);

      should(res.header).have.property('content-range');
      should(res.header['content-range']).startWith('0-');
    });

    it('should default limit and skip if non-numeric values are passed', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/messages/conversations?limit=abc&skip=xyz')
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(206);

      should(res.body).have.property('conversations');
      should(res.body.conversations).be.an.Array();
    });
  });

  describe('GET /api/v1/messages/conversations/archived', () => {
    it('should return empty list if no archived conversations', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/messages/conversations/archived')
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(206);

      should(res.body.conversations).have.length(0);
    });
  });

  describe('GET /api/v1/messages/conversations/:id', () => {
    it('should return messages and mark them as read', async () => {
      const result = await sails.sendNativeQuery(
        'SELECT id_conversation FROM j_participant WHERE id_caver = $1 LIMIT 1',
        [sender.id]
      );
      const convoId = result.rows[0].id_conversation;

      await TMessage.create({
        conversation: convoId,
        caverSender: recipient.id,
        body: 'Unread from recipient',
        dateSent: new Date(),
      });

      const res = await supertest(sails.hooks.http.app)
        .get(`/api/v1/messages/conversations/${convoId}`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(206);

      should(res.body).have.property('messages');
      should(res.body.messages).be.an.Array();
      should(res.body.messages.length).be.greaterThan(0);

      const unreadCount = await TMessage.count({
        conversation: convoId,
        caverSender: recipient.id,
        dateRead: null,
      });
      should(unreadCount).be.equal(0);
    });

    it('should return 403 if not a participant', async () => {
      const otherConvo = await TConversation.create({}).fetch();
      manuallyCreatedConversationIds.push(otherConvo.id);
      const res = await supertest(sails.hooks.http.app)
        .get(`/api/v1/messages/conversations/${otherConvo.id}`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(403);
      should(res.body.code).be.equal('E_AUTHORIZATION');
    });
  });

  describe('GET /api/v1/messages/unread/count', () => {
    it('should return unread counts for active and archived lists', async () => {
      const result = await sails.sendNativeQuery(
        'SELECT id_conversation FROM j_participant WHERE id_caver = $1 LIMIT 1',
        [sender.id]
      );
      const convoId = result.rows[0].id_conversation;

      await TMessage.create({
        conversation: convoId,
        caverSender: recipient.id,
        body: 'Unread active',
        dateSent: new Date(),
      });

      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/messages/unread/count')
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      should(res.body).have.properties(['active', 'archived']);
      should(res.body.active).be.greaterThanOrEqual(1);
      should(res.body.archived).be.equal(0);
    });
  });

  describe('MessageService.getMessages', () => {
    it('should mark messages as read when readerId is provided', async () => {
      const result = await sails.sendNativeQuery(
        'SELECT id_conversation FROM j_participant WHERE id_caver = $1 LIMIT 1',
        [sender.id]
      );
      const convoId = result.rows[0].id_conversation;

      await TMessage.create({
        conversation: convoId,
        caverSender: recipient.id,
        body: 'Service unread test',
        dateSent: new Date(),
      });

      await MessageService.getMessages(convoId, 0, 10, sender.id);

      const unreadCount = await TMessage.count({
        conversation: convoId,
        caverSender: recipient.id,
        dateRead: null,
      });
      should(unreadCount).be.equal(0);
    });

    it('should throw an error if readerId is NOT provided', async () => {
      const result = await sails.sendNativeQuery(
        'SELECT id_conversation FROM j_participant WHERE id_caver = $1 LIMIT 1',
        [sender.id]
      );
      const convoId = result.rows[0].id_conversation;

      try {
        await MessageService.getMessages(convoId, 0, 10);
        throw new Error('Should have thrown an error');
      } catch (err) {
        should(err.message).be.equal('readerId is required to fetch messages');
      }
    });

    it('should NOT leak PII in message responses', async () => {
      const result = await sails.sendNativeQuery(
        'SELECT id_conversation FROM j_participant WHERE id_caver = $1 LIMIT 1',
        [sender.id]
      );
      const convoId = result.rows[0].id_conversation;

      const res = await supertest(sails.hooks.http.app)
        .get(`/api/v1/messages/conversations/${convoId}`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(206);

      const message = res.body.messages[0];
      should(message).have.property('caverSender');
      should(message.caverSender).have.properties(['id', 'nickname']);
      should(message.caverSender).not.have.properties([
        'mail',
        'login',
        'password',
        'name',
        'surname',
      ]);
    });
  });

  describe('Conversation Management', () => {
    let convoId;

    before(async () => {
      const result = await sails.sendNativeQuery(
        'SELECT id_conversation FROM j_participant WHERE id_caver = $1 LIMIT 1',
        [sender.id]
      );
      convoId = result.rows[0].id_conversation;
    });

    it('should return 403 if trying to archive a conversation not belonging to', async () => {
      const convo = await TConversation.create({}).fetch();
      manuallyCreatedConversationIds.push(convo.id);
      const res = await supertest(sails.hooks.http.app)
        .post(`/api/v1/messages/conversations/${convo.id}/archive`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(403);

      should(res.body.code).be.equal('E_AUTHORIZATION');
    });

    it('should archive a conversation and create an archive record', async () => {
      await supertest(sails.hooks.http.app)
        .post(`/api/v1/messages/conversations/${convoId}/archive`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(204);

      const archiveRow = await TConversationArchive.findOne({
        conversation: convoId,
        caver: sender.id,
      });
      should(archiveRow).not.be.undefined();
      should(archiveRow.archivedAt).be.a.Date();
    });

    it('should sort archived conversations by archivedAt DESC', async () => {
      const recipient2 = await createEligibleUser({
        mail: 'recipient2@test.com',
        nickname: 'Recipient2',
      });

      try {
        const convo2Res = await supertest(sails.hooks.http.app)
          .post('/api/v1/messages')
          .set('Authorization', `Bearer ${senderToken}`)
          .send({ recipientId: recipient2.id, body: 'Message to recipient 2' })
          .expect(200);

        const convoId2 = convo2Res.body.conversation;
        if (convoId2) {
          manuallyCreatedConversationIds.push(convoId2);
        }

        // Manually create archive records with explicit times to ensure stable sorting
        // Clear existing archives first for this caver
        await TConversationArchive.destroy({ caver: sender.id });

        const now = new Date();
        const older = new Date(now.getTime() - 10000);

        await TConversationArchive.create({
          conversation: convoId,
          caver: sender.id,
          archivedAt: older,
        });

        await TConversationArchive.create({
          conversation: convoId2,
          caver: sender.id,
          archivedAt: now,
        });

        const res = await supertest(sails.hooks.http.app)
          .get('/api/v1/messages/conversations/archived')
          .set('Authorization', `Bearer ${senderToken}`)
          .expect(206);

        should(res.body.conversations).be.an.Array();
        should(res.body.conversations.length).be.equal(2);
        // convoId2 should be first as it has the most recent archivedAt
        should(res.body.conversations[0].id).be.equal(convoId2);
        should(res.body.conversations[0].archivedAt).not.be.null();
      } finally {
        await TCaver.destroy({ id: recipient2.id });
      }
    });

    it('should list the archived conversation', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/messages/conversations/archived')
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(206);

      const ids = res.body.conversations.map((c) => c.id);
      should(ids).containEql(convoId);
    });

    it('should unarchive a conversation and remove the archive record', async () => {
      await supertest(sails.hooks.http.app)
        .post(`/api/v1/messages/conversations/${convoId}/unarchive`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(204);

      const archiveRow = await TConversationArchive.findOne({
        conversation: convoId,
        caver: sender.id,
      });
      should(archiveRow).be.undefined();
    });
  });
});
