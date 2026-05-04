const should = require('should');
const supertest = require('supertest');
const TokenService = require('../../../api/services/TokenService');

describe('Messages features', () => {
  let sender;
  let recipient;
  let bannedRecipient;
  let nonUserRecipient;
  let senderToken;

  before(async () => {
    // Create test users
    sender = await TCaver.create({
      mail: 'sender@test.com',
      nickname: 'SenderUser',
      activated: true,
      login: 'sender_login',
    }).fetch();

    recipient = await TCaver.create({
      mail: 'recipient@test.com',
      nickname: 'RecipientUser',
      activated: true,
      login: 'recipient_login',
    }).fetch();

    bannedRecipient = await TCaver.create({
      mail: 'banned@test.com',
      nickname: 'BannedUser',
      activated: true,
      login: 'banned_login',
      banned: true,
    }).fetch();

    nonUserRecipient = await TCaver.create({
      mail: 'nonuser@mail.no',
      nickname: 'NonUser',
      activated: true,
      login: null, // Non-user caver has null login
    }).fetch();

    senderToken = TokenService.issue({ id: sender.id }, 3600, 'auth');
  });

  after(async () => {
    // Cleanup
    await TMessage.destroy({});
    await sails.sendNativeQuery('DELETE FROM j_participant');
    await TConversation.destroy({});
    await TCaver.destroy({
      id: [sender.id, recipient.id, bannedRecipient.id, nonUserRecipient.id],
    });
  });

  describe('POST /api/v1/messages', () => {
    it('should return 400 if body is empty', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ recipientId: recipient.id, body: '' })
        .expect(400, done);
    });

    it('should return 400 if body is whitespace only', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ recipientId: recipient.id, body: '   ' })
        .expect(400, done);
    });

    it('should return 400 if body exceeds 5000 chars', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ recipientId: recipient.id, body: 'a'.repeat(5001) })
        .expect(400, done);
    });

    it('should return 400 if sending to self', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ recipientId: sender.id, body: 'Hello self' })
        .expect(400, done);
    });

    it('should return 404 if recipient does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ recipientId: 999999, body: 'Hello' })
        .expect(404, done);
    });

    it('should return 403 if recipient is banned', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ recipientId: bannedRecipient.id, body: 'Hello banned' })
        .expect(403, done);
    });

    it('should return 403 if recipient is non-user (no login)', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ recipientId: nonUserRecipient.id, body: 'Hello non-user' })
        .expect(403, done);
    });

    it('should create a new conversation and message on first contact', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ recipientId: recipient.id, body: 'First message' })
        .expect(200)
        .end(async (err, res) => {
          if (err) {
            done(err);
            return;
          }
          should(res.body).have.property('body', 'First message');
          should(res.body).have.property('conversation');
          const convoId = res.body.conversation;

          // Check participants
          const participantsResult = await sails.sendNativeQuery(
            'SELECT id_caver FROM j_participant WHERE id_conversation = $1',
            [convoId]
          );
          const participants = participantsResult.rows;
          should(participants).have.length(2);
          const caverIds = participants.map((p) => p.id_caver);
          should(caverIds).containEql(sender.id);
          should(caverIds).containEql(recipient.id);
          done();
        });
    });

    it('should reuse existing conversation on second contact', (done) => {
      // First, ensure conversation exists (from previous test or create new)
      supertest(sails.hooks.http.app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ recipientId: recipient.id, body: 'Second message' })
        .expect(200)
        .end(async (err, res) => {
          if (err) {
            done(err);
            return;
          }
          const convoId = res.body.conversation;

          // Verify it's the same conversation as before
          const messages = await TMessage.find({ conversation: convoId });
          should(messages.length).be.greaterThanOrEqual(2);
          done();
        });
    });

    it('should allow replying using conversationId', (done) => {
      // Get conversation ID between sender and recipient
      sails
        .sendNativeQuery(
          'SELECT id_conversation FROM j_participant WHERE id_caver = $1 LIMIT 1',
          [sender.id]
        )
        .then((result) => {
          const convoId = result.rows[0].id_conversation;
          supertest(sails.hooks.http.app)
            .post('/api/v1/messages')
            .set('Authorization', `Bearer ${senderToken}`)
            .send({ conversationId: convoId, body: 'Reply message' })
            .expect(200)
            .end((err, res) => {
              if (err) {
                done(err);
                return;
              }
              should(res.body.conversation).be.equal(convoId);
              done();
            });
          return null;
        });
    });

    it('should return 403 if replying to a conversation not belonging to', (done) => {
      // Create a separate conversation
      TConversation.create({})
        .fetch()
        .then((convo) => {
          supertest(sails.hooks.http.app)
            .post('/api/v1/messages')
            .set('Authorization', `Bearer ${senderToken}`)
            .send({ conversationId: convo.id, body: 'Intruder message' })
            .expect(403, done);
          return null;
        });
    });
  });

  describe('GET /api/v1/messages/conversations', () => {
    it('should return a paginated list of active conversations', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/messages/conversations')
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(206)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('conversations');
          should(res.body.conversations).be.an.Array();
          should(res.body.conversations.length).be.greaterThan(0);
          const convo = res.body.conversations[0];
          should(convo).have.properties([
            'id',
            'lastMessage',
            'unreadCount',
            'otherParticipant',
          ]);
          should(convo.otherParticipant).have.properties(['id', 'nickname']);
          should(convo.otherParticipant.nickname).be.equal('RecipientUser');
          done();
          return null;
        });
    });

    it('should cap limit at 50', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/messages/conversations?limit=100')
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(206)
        .end((err, res) => {
          if (err) return done(err);
          should(res.header).have.property('content-range');
          should(res.header['content-range']).startWith('0-');
          // The limit in treatRange is used for Content-Range
          done();
          return null;
        });
    });
  });

  describe('GET /api/v1/messages/conversations/archived', () => {
    it('should return empty list if no archived conversations', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/messages/conversations/archived')
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(206)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.conversations).have.length(0);
          done();
          return null;
        });
    });
  });

  describe('GET /api/v1/messages/conversations/:id', () => {
    it('should return messages and mark them as read', async () => {
      // Get conversation ID
      const result = await sails.sendNativeQuery(
        'SELECT id_conversation FROM j_participant WHERE id_caver = $1 LIMIT 1',
        [sender.id]
      );
      const convoId = result.rows[0].id_conversation;

      // Ensure an unread message from recipient exists
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

      // Verify marked as read
      const unreadCount = await TMessage.count({
        conversation: convoId,
        caverSender: recipient.id,
        dateRead: null,
      });
      should(unreadCount).be.equal(0);
    });

    it('should return 403 if not a participant', async () => {
      const otherConvo = await TConversation.create({}).fetch();
      await supertest(sails.hooks.http.app)
        .get(`/api/v1/messages/conversations/${otherConvo.id}`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(403);
    });
  });
});
