const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Massif features', () => {
  describe('create', () => {
    let adminToken;
    before(async () => {
      sails.log.info('Asking for user auth token...');
      adminToken = await AuthTokenService.getRawBearerAdminToken();
    });

    describe('Missing parameters', () => {
      it('should return code 400', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/massifs')
          .send({})
          .set('Authorization', adminToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });
    describe('Complete data', () => {
      let createdMassif;

      after(async () => {
        // Destroy created data
        should(createdMassif).be.not.undefined();
        await TMassif.destroyOne(createdMassif.id);
        await TDescription.destroy(createdMassif.descriptions.map((d) => d.id));
        await TName.destroy(createdMassif.names.map((n) => n.id));
      });

      it('should return code 200', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/massifs')
          .send({
            name: 'Massif 1',
            caves: [{ id: 1 }, { id: 2 }],
            description: 'description du massif',
            descriptionTitle: 'Titre',
            descriptionAndNameLanguage: { id: 'fra' },
            documents: [{ id: 1 }, { id: 2 }],
            geogPolygon: {
              type: 'MultiPolygon',
              coordinates: [
                [
                  [
                    [86.66015625, 69.193799765],
                    [52.3828125, 58.263287052],
                    [92.28515625, 53.330872983],
                    [86.66015625, 69.193799765],
                  ],
                ],
                [
                  [
                    [89.82421875, 68.52823492],
                    [107.2265625, 59.977005492],
                    [107.490234375, 68.52823492],
                    [99.31640625, 70.988349224],
                    [98.0859375, 73.800318164],
                    [87.626953125, 72.711903108],
                    [86.396484375, 69.990534959],
                    [89.82421875, 68.52823492],
                  ],
                ],
              ],
            },
          })
          .set('Authorization', adminToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const { body: massif } = res;
            should(massif.names.length).equal(1);
            should(massif.names).containDeep([
              { name: 'Massif 1', language: 'fra' },
            ]);
            should(massif.descriptions.length).equal(1);
            should(massif.descriptions).containDeep([
              {
                title: 'Titre',
                body: 'description du massif',
                language: 'fra',
              },
            ]);
            should(massif.documents.length).equal(2);
            should(massif.documents).containDeep([{ id: 1 }, { id: 2 }]);
            should(massif.caves.length).equal(2);
            should(massif.caves).containDeep([{ id: 1 }, { id: 2 }]);
            should(massif.geogPolygon).equal(
              'MULTIPOLYGON(((86.66015625 69.193799765,52.3828125 58.263287052,92.28515625 53.330872983,86.66015625 69.193799765)),((89.82421875 68.52823492,107.2265625 59.977005492,107.490234375 68.52823492,99.31640625 70.988349224,98.0859375 73.800318164,87.626953125 72.711903108,86.396484375 69.990534959,89.82421875 68.52823492)))'
            );
            createdMassif = massif;

            return done();
          });
      });
    });
  });
});
