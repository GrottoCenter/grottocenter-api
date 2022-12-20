const supertest = require('supertest');
const should = require('should');

const AuthTokenService = require('../../AuthTokenService');

describe('Cave features', () => {
  let userToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('Update', async () => {
    describe('Invalid cave id', () => {
      it('should return code 404 on inexisting cave', (done) => {
        supertest(sails.hooks.http.app)
          .put(`/api/v1/caves/987654321`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(404, done);
      });
    });

    describe('Successfull updates', () => {
      const caveId = 1;
      let initialCave = {};

      after(async () => {
        initialCave = await TCave.findOne(caveId)
          .populate('author')
          .populate('reviewer')
          .populate('comments')
          .populate('descriptions')
          .populate('documents')
          .populate('entrances')
          .populate('exploringGrottos')
          .populate('histories')
          .populate('names')
          .populate('partneringGrottos')
          .populate('riggings');
      });

      after(async () => {
        // Reset cave
        const cleanedData = {
          ...initialCave,
          author: initialCave.author?.id,
          reviewer: initialCave.reviewer?.id,
          comments: initialCave.comments.map((x) => x.id),
          descriptions: initialCave.descriptions.map((x) => x.id),
          entrances: initialCave.entrances.map((x) => x.id),
          exploringGrottos: initialCave.exploringGrottos.map((x) => x.id),
          histories: initialCave.histories.map((x) => x.id),
          names: initialCave.names.map((x) => x.id),
          partneringGrottos: initialCave.partneringGrottos.map((x) => x.id),
          riggings: initialCave.riggings.map((x) => x.id),
        };
        await TCave.update(caveId).set(cleanedData);
      });

      it('should return code 200 on basic data update', (done) => {
        const newValues = {
          depth: 100,
          isDiving: true,
          latitude: 33,
          length: 100,
          longitude: 55,
          temperature: 10,
        };
        supertest(sails.hooks.http.app)
          .put(`/api/v1/caves/${caveId}`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send(newValues)
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const { body: cave } = res;
            for (const key of Object.keys(newValues)) {
              should(cave[key]).equal(newValues[key]);
            }
            return done();
          });
      });

      it('should return code 200 on entrances update', (done) => {
        supertest(sails.hooks.http.app)
          .put(`/api/v1/caves/${caveId}`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({
            entrances: [1, 2],
          })
          .expect(200)
          .end(async (err) => {
            if (err) return done(err);
            const populatedCave = await TCave.findOne(caveId).populate(
              'entrances'
            );
            should(populatedCave.entrances[0].id).equal(1);
            should(populatedCave.entrances[1].id).equal(2);
            return done();
          });
      });

      it('should return code 200 on name update', (done) => {
        supertest(sails.hooks.http.app)
          .put(`/api/v1/caves/${caveId}`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({
            name: {
              text: 'new cave name',
              language: 'aut',
            },
          })
          .expect(200)
          .end(async (err) => {
            if (err) return done(err);
            const populatedCave = await TCave.findOne(caveId).populate('names');
            should(populatedCave.names[0].name).equal('new cave name');
            should(populatedCave.names[0].language).equal('aut');
            return done();
          });
      });
    });
  });
});
