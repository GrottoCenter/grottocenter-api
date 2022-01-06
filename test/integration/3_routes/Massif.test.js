let supertest = require('supertest');
let should = require('should');

const MASSIF_PROPERTIES = [
  '@context',
  '@id',
  '@type',
  'id',
  'dateInscription',
  'dateReviewed',
  'descriptions',
  'entrances',
  'name',
  'names',
  'reviewer',
];

// TODO: These tests are waiting for a solution allowing the transaction to be run during test.
// For more info, see: https://github.com/GrottoCenter/Grottocenter3/pull/629#issuecomment-943298608

// describe('Massif features', () => {
//   describe('find()', () => {
//     it('should return code 404', (done) => {
//       supertest(sails.hooks.http.app)
//         .get('/api/v1/massifs/987654321')
//         .set('Content-type', 'application/json')
//         .set('Accept', 'application/json')
//         .expect(404, done);
//     });
//     it('should return code 200', (done) => {
//       supertest(sails.hooks.http.app)
//         .get('/api/v1/massifs/1')
//         .set('Content-type', 'application/json')
//         .set('Accept', 'application/json')
//         .expect(200)
//         .end((err, res) => {
//           if (err) return done(err);
//           const { body: massif } = res;
//           should(massif).have.properties(MASSIF_PROPERTIES);
//           should(massif.name).not.be.empty();
//           should(massif.names).not.be.empty();
//           return done();
//         });
//     });
//   });
// });
