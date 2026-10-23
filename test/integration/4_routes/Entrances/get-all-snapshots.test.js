require('should');
const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

// Keys of a t_caver row that no public response may contain.
const CAVER_PRIVATE_KEYS = [
  'login',
  'password',
  'mail',
  'activationCode',
  'totpSecret',
  'lastUsedTotp',
];

describe('Entrance get-all-snapshots', () => {
  let moderatorToken;
  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  describe('GET /api/v1/entrances/:id/all-snapshots', () => {
    it('should return 404 for entrance with no snapshots', async () => {
      const entrance = await TEntrance.create({
        name: 'Test',
        latitude: 1,
        longitude: 1,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .get(`/api/v1/entrances/${entrance.id}/all-snapshots`)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404);

      // Clean up
      await TEntrance.destroy({ id: entrance.id });
    });

    it('should return 404 for an unknown entrance', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/999999/all-snapshots')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404);
    });

    it('should return 200 with snapshots for entrance with history', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/1/all-snapshots')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);
    });

    it('should respect isNetwork query parameter', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/1/all-snapshots?isNetwork=true')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);
    });

    describe('with a snapshot of a described document', () => {
      // Document 1 is described by TDescription 1 (author 1, reviewer 2).
      const snapshotDate = '2030-01-02T00:00:00.000Z';
      let entrance;

      before(async () => {
        entrance = await TEntrance.create({
          name: 'Test',
          latitude: 1,
          longitude: 1,
        }).fetch();
        await JDocumentEntrance.create({ document: 1, entrance: entrance.id });
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
        await JDocumentEntrance.destroy({ entrance: entrance.id });
        await TEntrance.destroy({ id: entrance.id });
      });

      it('should only expose the id and nickname of the document description author and reviewer', async () => {
        const res = await supertest(sails.hooks.http.app)
          .get(`/api/v1/entrances/${entrance.id}/all-snapshots`)
          .set('Accept', 'application/json')
          .expect(200);

        res.body.documents.should.have.length(1);
        const { description } = res.body.documents[0];
        description.author.should.eql({ id: 1, nickname: 'Admin1' });
        description.reviewer.should.eql({ id: 2, nickname: 'Moderator1' });

        const serialized = JSON.stringify(res.body);
        CAVER_PRIVATE_KEYS.forEach((key) =>
          serialized.should.not.containEql(`"${key}"`)
        );
      });
    });

    it('should include deleted items for moderators', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/1/all-snapshots')
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);
    });
  });
});
