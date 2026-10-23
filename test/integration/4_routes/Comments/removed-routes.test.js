const supertest = require('supertest');

// These routes pointed at actions without a policy, so they always answered
// 403. The entrance details already carry the same stats and time infos.
const REMOVED_ROUTES = [
  '/api/v1/comments/stats/1',
  '/api/v1/comments/timeinfos/1',
  '/api/comments/stats/1',
  '/api/comments/timeinfos/1',
];

describe('Removed comment stats routes', () => {
  REMOVED_ROUTES.forEach((url) => {
    it(`GET ${url} should return 404`, async () => {
      await supertest(sails.hooks.http.app)
        .get(url)
        .set('Accept', 'application/json')
        .expect(404);
    });
  });
});
