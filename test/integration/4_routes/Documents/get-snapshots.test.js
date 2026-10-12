const supertest = require('supertest');
const should = require('should');

// Keys of a t_caver row that no public response may contain.
const CAVER_PRIVATE_KEYS = [
  'login',
  'password',
  'mail',
  'activationCode',
  'totpSecret',
  'lastUsedTotp',
];

describe('Document get-snapshots', () => {
  describe('GET /api/v1/documents/:id/snapshots', () => {
    it('should return 404 for document with no snapshots', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .get(`/api/v1/documents/${doc.id}/snapshots`)
        .set('Accept', 'application/json')
        .expect(404);
    });

    describe('with a snapshot of a described document', () => {
      // Document 1 is described by TDescription 1 (author 1, reviewer 2).
      const snapshotDate = '2030-01-01T00:00:00.000Z';

      before(async () => {
        await HDocument.create({
          id: snapshotDate,
          t_id: 1,
          author: 1,
          type: 1,
          license: 1,
        });
      });

      after(async () => {
        await HDocument.destroy({ id: snapshotDate });
      });

      it('should only expose the id and nickname of the description author and reviewer', async () => {
        const res = await supertest(sails.hooks.http.app)
          .get('/api/v1/documents/1/snapshots')
          .set('Accept', 'application/json')
          .expect(200);

        res.body.documents.should.have.length(1);
        const { description } = res.body.documents[0];
        should(description).be.an.Object();
        description.title.should.equal('An awesome collection');
        description.author.should.eql({ id: 1, nickname: 'Admin1' });
        description.reviewer.should.eql({ id: 2, nickname: 'Moderator1' });

        const serialized = JSON.stringify(res.body);
        CAVER_PRIVATE_KEYS.forEach((key) =>
          serialized.should.not.containEql(`"${key}"`)
        );
      });
    });
  });
});
