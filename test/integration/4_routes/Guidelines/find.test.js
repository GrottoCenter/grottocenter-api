const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

// Requirements: 2.5, 2.6, 2.7, 2.8, 2.9
// Req 2.8's "404 for a soft-deleted guideline" now holds only for anonymous and
// unprivileged callers: since #1804 a Moderator or an Administrator receives 200
// with the full hydrated detail and `isDeleted: true`.
describe('Guideline find', () => {
  // Guidelines dedicated to this file. Sibling test files in this same folder
  // mutate the seeded rows — update.test.js clears guideline 1's geographic
  // associations — and the whole 4_routes/Guidelines/ folder runs together in
  // one shard, so asserting on a seeded guideline's associations would be
  // order-dependent. These rows are created here and only read by this file
  // (mirroring rollback.test.js).
  let guidelineId;
  let deletedGuidelineId;
  let deletedWithGeoGuidelineId;
  let roundTripGuidelineId;
  let unreviewedGuidelineId;
  let moderatorToken;
  let adminToken;
  let userToken;
  let leaderToken;

  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    adminToken = await AuthTokenService.getRawBearerAdminToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
    leaderToken = await AuthTokenService.getRawBearerLeaderToken();

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

    // A soft-deleted guideline that still carries its geographic associations, so
    // the privileged view can be asserted on the same hydrated shape as an active
    // one. Deleted through `destroyOne` rather than created with
    // `isDeleted: true`: the `histo_delete` trigger turns the DELETE into an
    // UPDATE, and going through it is what proves the junction rows survive a
    // real soft delete (the contract guideline/delete.js relies on when it echoes
    // the pre-delete associations back).
    const deletedWithGeo = await TGuideline.create({
      title: 'Deleted Guideline With Geo For Find Test',
      description: 'A soft-deleted guideline owned by find.test.js.',
      author: 3,
      reviewer: 2,
      language: 'fra',
      dateInscription: new Date(),
    }).fetch();
    deletedWithGeoGuidelineId = deletedWithGeo.id;
    await TGuideline.addToCollection(deletedWithGeoGuidelineId, 'countries', [
      'FR',
    ]);
    await TGuideline.addToCollection(deletedWithGeoGuidelineId, 'regions', [
      'FR-01',
    ]);
    // Massif 1, not the soft-deleted fixture massif: `toList` filters deleted
    // items out of the converted array, so a deleted massif would silently
    // disappear from the response for reasons unrelated to this endpoint.
    await TGuideline.addToCollection(deletedWithGeoGuidelineId, 'massifs', [1]);
    await TGuideline.destroyOne({ id: deletedWithGeoGuidelineId });

    // Left active: the round-trip block below deletes and restores it over HTTP.
    const roundTrip = await TGuideline.create({
      title: 'Round Trip Guideline For Find Test',
      description: 'Deleted then restored by find.test.js.',
      author: 3,
      language: 'fra',
      dateInscription: new Date(),
    }).fetch();
    roundTripGuidelineId = roundTrip.id;
    await TGuideline.addToCollection(roundTripGuidelineId, 'countries', ['FR']);
    await TGuideline.addToCollection(roundTripGuidelineId, 'regions', [
      'FR-01',
    ]);
    await TGuideline.addToCollection(roundTripGuidelineId, 'massifs', [1]);

    // No reviewer: this is the state every guideline is created in, since
    // `create` never sets one. Kept separate from the row above so the
    // `reviewer: 2` assertions there stay meaningful.
    const unreviewed = await TGuideline.create({
      title: 'Find Guideline Without Reviewer',
      author: 3,
      language: 'fra',
      dateInscription: new Date(),
    }).fetch();
    unreviewedGuidelineId = unreviewed.id;
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

    // `reviewer` is null on every freshly created guideline (create never sets
    // one) and the converter passes null straight through, so the detail
    // response really does carry `reviewer: null`. This pins the OpenAPI
    // contract: `GuidelineDetail.reviewer` must stay a nullable schema, which
    // under OpenAPI 3.0 means `nullable` beside an `allOf` wrapper — a
    // `nullable` sibling of `$ref` is ignored and would reject this response.
    it('should return reviewer as null for a guideline that has no reviewer', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get(`/api/v1/guidelines/${unreviewedGuidelineId}`)
        .expect(200);

      should(res.body).have.property('reviewer', null);
    });

    // Req 2.8, #1804: a soft-deleted guideline stays hidden from the public
    it('should return 404 for a soft-deleted guideline when anonymous', (done) => {
      supertest(sails.hooks.http.app)
        .get(`/api/v1/guidelines/${deletedGuidelineId}`)
        .expect(404, done);
    });

    // #1804: authentication alone does not grant the deleted view
    it('should return 404 for a soft-deleted guideline for an unprivileged user', (done) => {
      supertest(sails.hooks.http.app)
        .get(`/api/v1/guidelines/${deletedGuidelineId}`)
        .set('Authorization', userToken)
        .expect(404, done);
    });

    // #1804: roles are not hierarchical — Leader is not a lesser Moderator
    it('should return 404 for a soft-deleted guideline for a Leader', (done) => {
      supertest(sails.hooks.http.app)
        .get(`/api/v1/guidelines/${deletedGuidelineId}`)
        .set('Authorization', leaderToken)
        .expect(404, done);
    });

    // #1804: a Moderator gets the full hydrated detail, not the reduced deleted
    // shape the core-content find controllers fall back to. Asserting every
    // relation also pins that a trigger-driven soft delete leaves the junction
    // rows and the batched massif-name lookup intact.
    it('should return 200 with the full hydrated representation for a Moderator on a soft-deleted guideline', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get(`/api/v1/guidelines/${deletedWithGeoGuidelineId}`)
        .set('Authorization', moderatorToken)
        .expect(200);

      const g = res.body;
      should(g).have.property('id', deletedWithGeoGuidelineId);
      should(g).have.property('isDeleted', true);
      should(g).have.property('title').which.is.a.String();
      should(g.countries).have.length(1);
      should(g.countries[0]).have.property('id', 'FR');
      should(g.countries[0]).have.property('name', 'France');
      should(g.regions).have.length(1);
      should(g.regions[0]).have.property('id', 'FR-01');
      should(g.regions[0]).have.property('name', 'Ain');
      should(g.regions[0]).have.property('countryId', 'FR');
      should(g.massifs).have.length(1);
      should(g.massifs[0]).have.property('id', 1);
      should(g.massifs[0]).have.property('name').which.is.a.String();
      should(g.massifs[0].name).not.be.empty();
      should(g.language).have.property('id', 'fra');
      should(g.language).have.property('refName', 'French');
      should(g.author).have.property('id', 3);
      should(g.reviewer).have.property('id', 2);
    });

    // #1804: an Administrator is granted the same view, because delete and
    // restore accept either role
    it('should return the same full representation for an Administrator on a soft-deleted guideline', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get(`/api/v1/guidelines/${deletedWithGeoGuidelineId}`)
        .set('Authorization', adminToken)
        .expect(200);

      const g = res.body;
      should(g).have.property('id', deletedWithGeoGuidelineId);
      should(g).have.property('isDeleted', true);
      should(g.countries).have.length(1);
      should(g.regions).have.length(1);
      should(g.massifs).have.length(1);
      should(g.language).have.property('refName', 'French');
    });

    // Req 2.8: non-existent ID returns 404
    it('should return 404 for a non-existent guideline ID', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/guidelines/999999')
        .expect(404, done);
    });

    // #1804: the privileged branch reveals deleted guidelines, never missing ones
    it('should return 404 for a non-existent guideline ID for a Moderator', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/guidelines/999999')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 404 for a non-existent guideline ID for an Administrator', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/guidelines/999999')
        .set('Authorization', adminToken)
        .expect(404, done);
    });

    // #1804: hiding a deleted guideline must not leak that it exists, so the two
    // 404 bodies have to be identical apart from the id.
    it('should return the same 404 message for a hidden deleted guideline as for a missing one', async () => {
      const [deletedRes, missingRes] = await Promise.all([
        supertest(sails.hooks.http.app)
          .get(`/api/v1/guidelines/${deletedGuidelineId}`)
          .expect(404),
        supertest(sails.hooks.http.app)
          .get('/api/v1/guidelines/999999')
          .expect(404),
      ]);

      should(deletedRes.body.message).equal(
        `Guideline of id ${deletedGuidelineId} not found.`
      );
      should(missingRes.body.message).equal(
        'Guideline of id 999999 not found.'
      );
    });

    // The new privileged branch runs inside the controller, so the validateId
    // policy must still reject a malformed id before it.
    it('should still reject a malformed id for a Moderator', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/guidelines/0')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });
  });

  // #1804: the exact sequence the web client performs. Every step goes over HTTP
  // so the `change_guideline` trigger and RecentChangeService run for real, and
  // the detail GET in step 2 is the one that used to answer 404.
  describe('delete then privileged detail then restore round trip', () => {
    it('should let a Moderator read the guideline throughout, without an intermediate 404', async () => {
      const deleteRes = await supertest(sails.hooks.http.app)
        .delete(`/api/v1/guidelines/${roundTripGuidelineId}`)
        .set('Authorization', moderatorToken)
        .expect(200);
      should(deleteRes.body).have.property('isDeleted', true);

      const detailRes = await supertest(sails.hooks.http.app)
        .get(`/api/v1/guidelines/${roundTripGuidelineId}`)
        .set('Authorization', moderatorToken)
        .expect(200);
      should(detailRes.body).have.property('isDeleted', true);
      should(detailRes.body.countries).have.length(1);
      should(detailRes.body.regions).have.length(1);
      should(detailRes.body.massifs).have.length(1);

      await supertest(sails.hooks.http.app)
        .get(`/api/v1/guidelines/${roundTripGuidelineId}`)
        .expect(404);

      const restoreRes = await supertest(sails.hooks.http.app)
        .post(`/api/v1/guidelines/${roundTripGuidelineId}/restore`)
        .set('Authorization', moderatorToken)
        .expect(200);
      should(restoreRes.body).have.property('isDeleted', false);

      const publicRes = await supertest(sails.hooks.http.app)
        .get(`/api/v1/guidelines/${roundTripGuidelineId}`)
        .expect(200);
      should(publicRes.body).have.property('isDeleted', false);
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
