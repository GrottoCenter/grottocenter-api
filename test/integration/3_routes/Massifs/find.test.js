const supertest = require('supertest');
const should = require('should');

const MASSIF_PROPERTIES = [
  '@context',
  '@id',
  '@type',
  'id',
  'dateInscription',
  'dateReviewed',
  'descriptions',
  'documents',
  'entrances',
  'geogPolygon',
  'name',
  'names',
  'reviewer',
];

describe('Massif features', () => {
  describe('find', () => {
    it('should return code 404', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/massifs/987654321')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/massifs/1')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: massif } = res;
          console.log(massif);
          should(massif).have.properties(MASSIF_PROPERTIES);
          should(massif.geogPolygon).equal(
            JSON.stringify({
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
            })
          );
          should(massif.name).not.be.empty();
          should(massif.names).not.be.empty();
          return done();
        });
    });
  });
});
