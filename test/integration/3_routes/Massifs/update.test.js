const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Massif feature', () => {
  let userToken;
  before(async () => {
    sails.log.info('Asking for user auth token...');
    userToken = await AuthTokenService.getRawBearerUserToken();
  });
  describe('update', () => {
    it('should raise an error if a non-existing id of a massif is passed ', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/massifs/123456789')
        .send({})
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should modify the massif data with userToken', (done) => {
      const update = {
        caves: [1, 2],
        descriptions: [3],
        documents: [2, 3],
        geogPolygon: {
          type: 'MultiPolygon',
          coordinates: [
            [
              [
                [2.845458984375, 43.39706523932025],
                [3.504638671875, 43.77902662160831],
                [4.06494140625, 44.22945656830167],
                [4.658203125, 44.715513732021336],
                [5.064697265625, 45.213003555993964],
                [5.515136718749999, 45.85176048817254],
                [5.657958984374999, 46.255846818480315],
                [5.833740234375, 46.6795944656402],
                [5.80078125, 47.010225655683485],
                [5.756835937499999, 47.30903424774781],
                [5.4931640625, 47.76148371616669],
                [4.98779296875, 48.011975126709956],
                [4.46044921875, 48.20271028869972],
                [4.075927734375, 48.28319289548349],
                [3.5815429687499996, 48.28319289548349],
                [3.131103515625, 48.16608541901253],
                [2.8894042968749996, 48.011975126709956],
                [2.65869140625, 47.83528342275264],
                [2.548828125, 47.61356975397398],
                [2.493896484375, 47.4057852900587],
                [2.362060546875, 47.06263847995432],
                [2.35107421875, 47.25686404408872],
                [2.26318359375, 47.53203824675999],
                [2.120361328125, 47.79101617826261],
                [1.900634765625, 48.011975126709956],
                [1.64794921875, 48.21003212234042],
                [1.285400390625, 48.268569112964336],
                [0.615234375, 48.20271028869972],
                [-0.252685546875, 47.87214396888731],
                [-0.889892578125, 46.837649560937464],
                [-1.021728515625, 45.767522962149876],
                [-0.714111328125, 45.166547157856016],
                [-0.142822265625, 44.55916341529182],
                [0.823974609375, 43.99281450048989],
                [2.845458984375, 43.39706523932025],
              ],
            ],
          ],
        },
        names: [3],
      };
      supertest(sails.hooks.http.app)
        .put('/api/v1/massifs/1')
        .send(update)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err) => {
          if (err) return done(err);

          const massifUpdated = await TMassif.findOne(1)
            .populate('caves')
            .populate('names')
            .populate('descriptions')
            .populate('documents');

          should(massifUpdated.caves).containDeep([{ id: 1 }, { id: 2 }]);
          should(massifUpdated.descriptions).containDeep([{ id: 3 }]);
          should(massifUpdated.documents).containDeep([{ id: 2 }, { id: 3 }]);
          should(massifUpdated.geogPolygon).equal(
            'MULTIPOLYGON(((2.845458984375 43.39706523932025,3.504638671875 43.77902662160831,4.06494140625 44.22945656830167,4.658203125 44.715513732021336,5.064697265625 45.213003555993964,5.515136718749999 45.85176048817254,5.657958984374999 46.255846818480315,5.833740234375 46.6795944656402,5.80078125 47.010225655683485,5.756835937499999 47.30903424774781,5.4931640625 47.76148371616669,4.98779296875 48.011975126709956,4.46044921875 48.20271028869972,4.075927734375 48.28319289548349,3.58154296875 48.28319289548349,3.131103515625 48.16608541901253,2.889404296875 48.011975126709956,2.65869140625 47.83528342275264,2.548828125 47.61356975397398,2.493896484375 47.4057852900587,2.362060546875 47.06263847995432,2.35107421875 47.25686404408872,2.26318359375 47.53203824675999,2.120361328125 47.79101617826261,1.900634765625 48.011975126709956,1.64794921875 48.21003212234042,1.285400390625 48.268569112964336,0.615234375 48.20271028869972,-0.252685546875 47.87214396888731,-0.889892578125 46.837649560937464,-1.021728515625 45.767522962149876,-0.714111328125 45.166547157856016,-0.142822265625 44.55916341529182,0.823974609375 43.99281450048989,2.845458984375 43.39706523932025)))'
          );
          should(massifUpdated.names).containDeep([{ id: 3 }]);
          return done();
        });
    });

    describe('Only authorized field should be updated', () => {
      it('should raise an error if changes are requested on unauthorized fields', (done) => {
        const newRandomField = 'random';
        const update = {
          randomField: newRandomField,
        };
        supertest(sails.hooks.http.app)
          .put('/api/v1/massifs/1')
          .send(update)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });
  });
});
