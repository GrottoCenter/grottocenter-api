const supertest = require('supertest');
const should = require('should');

const AuthTokenService = require('../../AuthTokenService');

describe('Cave features', () => {
  let userToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('Update', () => {
    describe('Invalid cave id', () => {
      it('should return code 404 on inexisting cave', (done) => {
        supertest(sails.hooks.http.app)
          .put('/api/v1/caves/987654321')
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(404, done);
      });
    });

    describe('Successful updates', () => {
      const caveId = 1;
      let initialScalars = {};
      let initialEntranceIds = [];
      let initialNameData = {};

      before(async () => {
        const cave = await TCave.findOne(caveId)
          .populate('entrances')
          .populate('names');
        initialScalars = {
          depth: cave.depth,
          isDiving: cave.isDiving,
          length: cave.length,
          temperature: cave.temperature,
        };
        initialEntranceIds = cave.entrances.map((e) => e.id);
        if (cave.names.length > 0) {
          initialNameData = {
            id: cave.names[0].id,
            name: cave.names[0].name,
            language: cave.names[0].language,
          };
        }
      });

      after(async () => {
        // Restore scalar fields
        await TCave.updateOne(caveId).set(initialScalars);

        // Restore entrance associations
        await TCave.replaceCollection(caveId, 'entrances').members(
          initialEntranceIds
        );

        // Restore name if it was changed
        if (initialNameData.id) {
          await TName.updateOne(initialNameData.id).set({
            name: initialNameData.name,
            language: initialNameData.language,
          });
        }
      });

      it('should return code 200 on basic data update', (done) => {
        const newValues = {
          depth: 100,
          isDiving: true,
          length: 100,
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
            const populatedCave =
              await TCave.findOne(caveId).populate('entrances');
            should(populatedCave.entrances[0].id).equal(1);
            should(populatedCave.entrances[1].id).equal(2);
            return done();
          });
      });

      it('should return 200 when latitude and longitude are empty strings', (done) => {
        supertest(sails.hooks.http.app)
          .put(`/api/v1/caves/${caveId}`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({
            latitude: '',
            longitude: '',
          })
          .expect(200)
          .end(async (err) => {
            if (err) return done(err);
            // latitude/longitude are deprecated on TCave and not exposed
            // by the toCave converter, so verify at the DB level.
            const cave = await TCave.findOne(caveId);
            should(cave.latitude).equal(null);
            should(cave.longitude).equal(null);
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
