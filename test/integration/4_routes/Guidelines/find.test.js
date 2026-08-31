const supertest = require('supertest');
const should = require('should');

// Requirements: 2.5, 2.6, 2.7, 2.8, 2.9
describe('Guideline find', () => {
  // Guidelines dedicated to this file. Sibling test files in this same folder
  // mutate the seeded rows — update.test.js clears guideline 1's geographic
  // associations — and the whole 4_routes/Guidelines/ folder runs together in
  // one shard, so asserting on a seeded guideline's associations would be
  // order-dependent. These rows are created here and only read by this file
  // (mirroring rollback.test.js).
  let guidelineId;
  let deletedGuidelineId;

  before(async () => {
    const guideline = await TGuideline.create({
      title: 'Find Detail Guideline',
      description: 'A guideline owned by find.test.js.',
      author: 3,
      reviewer: 2,
      language: 'fra',
      dateInscription: new Date(),
    }).fetch();
    guidelineId = guideline.id;
    await TGuideline.addToCollection(guidelineId, 'countries', ['FR']);
    await TGuideline.addToCollection(guidelineId, 'regions', ['FR-01']);
    await TGuideline.addToCollection(guidelineId, 'massifs', [1]);

    // A soft-deleted guideline for 404 testing (no fixture needed)
    const deleted = await TGuideline.create({
      title: 'Deleted Guideline For Find Test',
      author: 3,
      language: 'fra',
      dateInscription: new Date(),
      isDeleted: true,
    }).fetch();
    deletedGuidelineId = deleted.id;
  });

  describe('GET /api/v1/guidelines/:id', () => {
    // Req 2.5, 2.8: public endpoint — no auth required, returns 200
    it('should return 200 without Authorization header (public endpoint)', (done) => {
      supertest(sails.hooks.http.app)
        .get(`/api/v1/guidelines/${guidelineId}`)
        .expect(200, done);
    });

    // Req 2.5, 2.6: existing non-deleted guideline returns 200 with correct shape
    it('should return 200 with correct shape for an existing non-deleted guideline', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get(`/api/v1/guidelines/${guidelineId}`)
        .expect(200);

      const g = res.body;
      should(g).have.property('id', guidelineId);
      should(g).have.property('title').which.is.a.String();
      should(g).have.property('description').which.is.a.String();
      should(g).have.property('countries').which.is.an.Array();
      should(g).have.property('regions').which.is.an.Array();
      should(g).have.property('massifs').which.is.an.Array();
      should(g).have.property('isDeleted', false);
      should(g.author).have.property('id', 3);
      should(g.reviewer).have.property('id', 2);
    });

    // Req 2.5: language is hydrated with its readable refName, not a bare code
    it('should hydrate language with its id and readable refName', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get(`/api/v1/guidelines/${guidelineId}`)
        .expect(200);

      should(res.body.language).have.property('id', 'fra');
      should(res.body.language).have.property('refName', 'French');
    });

    // Req 2.6: countries carry their ISO id and a readable name
    it('should return countries with their id and readable name', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get(`/api/v1/guidelines/${guidelineId}`)
        .expect(200);

      should(res.body.countries).have.length(1);
      should(res.body.countries[0]).have.property('id', 'FR');
      should(res.body.countries[0]).have.property('name', 'France');
    });

    // Req 2.7, 2.9: regions carry id, name and the countryId derived from the ISO prefix
    it('should return regions with id, name and countryId', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get(`/api/v1/guidelines/${guidelineId}`)
        .expect(200);

      should(res.body.regions).have.length(1);
      const region = res.body.regions[0];
      should(region).have.property('id', 'FR-01');
      should(region).have.property('name', 'Ain');
      should(region).have.property('countryId', 'FR');
    });

    // Req 2.6: massif names live in t_name, so they must be hydrated too
    it('should return massifs with their id and readable name', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get(`/api/v1/guidelines/${guidelineId}`)
        .expect(200);

      should(res.body.massifs).have.length(1);
      should(res.body.massifs[0]).have.property('id', 1);
      should(res.body.massifs[0]).have.property('name').which.is.a.String();
      should(res.body.massifs[0].name).not.be.empty();
    });

    // A guideline with no geographic associations is valid (see issue #1775)
    // and must still serialize as empty arrays rather than 404 or null.
    it('should return empty arrays for a guideline with no geographic associations', async () => {
      const bare = await TGuideline.create({
        title: 'Find Guideline Without Geo',
        author: 3,
        language: 'fra',
        dateInscription: new Date(),
      }).fetch();

      const res = await supertest(sails.hooks.http.app)
        .get(`/api/v1/guidelines/${bare.id}`)
        .expect(200);

      should(res.body.countries).be.an.Array().and.be.empty();
      should(res.body.regions).be.an.Array().and.be.empty();
      should(res.body.massifs).be.an.Array().and.be.empty();
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

  // Req 3.9, 3.10: the leaner toSimpleGuideline shape is unchanged on the
  // endpoints that share it — only the detail endpoint hydrates relations.
  describe('shared converter is unaffected', () => {
    it('should keep bare ISO strings for regions on the by-entity endpoint', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/guidelines/by-entity/region/FR-01')
        .expect(200);

      should(res.body).be.an.Array();
      should(res.body.length).be.greaterThan(0);
      should(res.body[0].regions).containEql('FR-01');
    });
  });
});
