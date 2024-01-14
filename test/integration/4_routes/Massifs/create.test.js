const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');
const massifPolygon = require('./FAKE_DATA');

describe('Massif features', () => {
  describe('create', () => {
    let adminToken;
    before(async () => {
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
        await TName.destroy({ massif: createdMassif.id });
      });

      it('should return code 200', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/massifs')
          .send({
            name: 'Massif 1',
            description: 'description du massif',
            descriptionTitle: 'Titre',
            descriptionAndNameLanguage: { id: 'fra' },
            documents: [1, 2],
            geogPolygon: massifPolygon.geoJson1,
          })
          .set('Authorization', adminToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const { body: massif } = res;
            should(massif.name).equal('Massif 1');
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
            should(massif.geogPolygon).equal(massifPolygon.geoJson1ToString);
            createdMassif = massif;
            return done();
          });
      });
    });
  });
});
