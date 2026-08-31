const supertest = require('supertest');
const should = require('should');

// Requirements: 2.5, 2.6, 2.7, 2.8, 2.9
describe('Guideline find', () => {
  let deletedGuidelineId;

  before(async () => {
    // Create a soft-deleted guideline for 404 testing (no fixture needed)
    const guideline = await TGuideline.create({
      title: 'Deleted Guideline For Find Test',
      author: 3,
      language: 'fra',
      dateInscription: new Date(),
      isDeleted: true,
    }).fetch();
    deletedGuidelineId = guideline.id;
  });

  describe('GET /api/v1/guidelines/:id', () => {
    // Req 2.5, 2.8: public endpoint — no auth required, returns 200
    it('should return 200 without Authorization header (public endpoint)', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/guidelines/1')
        .expect(200, done);
    });

    // Req 2.5, 2.6: existing non-deleted guideline returns 200 with correct shape
    it('should return 200 with correct shape for an existing non-deleted guideline', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/guidelines/1')
        .expect(200);

      const g = res.body;
      should(g).have.property('id', 1);
      should(g).have.property('title').which.is.a.String();
      should(g).have.property('description').which.is.a.String();
      should(g).have.property('language');
      should(g).have.property('countries').which.is.an.Array();
      should(g).have.property('regions').which.is.an.Array();
      should(g).have.property('massifs').which.is.an.Array();
      should(g).have.property('author');
      should(g).have.property('isDeleted', false);
    });

    // Req 2.6: guideline 1 has country FR — verify countries array contains the ISO code
    it('should return guideline 1 with country FR in countries array', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/guidelines/1')
        .expect(200);

      const g = res.body;
      should(g.countries).have.length(1);
      should(g.countries[0]).equal('FR');
    });

    // Req 2.7, 2.9: guideline 3 has region FR-01 — verify regions array shape with countryId
    it('should return guideline 3 with region FR-01 having correct shape including countryId', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/guidelines/3')
        .expect(200);

      const g = res.body;
      should(g.regions).have.length(1);
      const region = g.regions[0];
      should(region).have.property('id', 'FR-01');
      should(region).have.property('name').which.is.a.String();
      should(region).have.property('countryId', 'FR');
    });

    // Req 2.8: soft-deleted guideline returns 404
    it('should return 404 for a soft-deleted guideline', (done) => {
      supertest(sails.hooks.http.app)
        .get(`/api/v1/guidelines/${deletedGuidelineId}`)
        .expect(404, done);
    });

    // Req 2.8: non-existent ID returns 404
    it('should return 404 for a non-existent guideline ID', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/guidelines/999999')
        .expect(404, done);
    });
  });
});
