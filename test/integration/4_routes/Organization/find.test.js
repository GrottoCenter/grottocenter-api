const supertest = require('supertest');
const should = require('should');
const {
  ORGANIZATION_TYPES,
  ORGANIZATION_TYPE_VALUES,
} = require('../../../../config/constants/organization');

const ORGANIZATION_PROPERTIES = [
  '@context',
  '@id',
  '@type',
  'id',
  'address',
  'authoredCount',
  'authoredDocuments',
  'publishedCount',
  'publishedDocuments',
  'city',
  'country',
  'county',
  'county',
  'customMessage',
  'exploredEntrances',
  'exploredNetworks',
  'isOfficialPartner',
  'latitude',
  'longitude',
  'name',
  'partnerEntrances',
  'partnerNetworks',
  'pictureFileName',
  'postalCode',
  'region',
  'type',
  'url',
  'yearBirth',
  'managedCountries',
  'managedRegions',
  'managedMassifs',
];

describe('Organization features', () => {
  describe('Find', () => {
    it('should return code 404 for non-existent organization', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/organizations/987654321')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 404 for organization ID 0', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/organizations/0')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 404 for negative organization ID', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/organizations/-1')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/organizations/1')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: organization } = res;
          should(organization).have.properties(ORGANIZATION_PROPERTIES);
          should(organization.name).not.be.empty();
          should(organization.dateInscription).not.be.empty();
          return done();
        });
    });

    // https://github.com/GrottoCenter/grottocenter-api/issues/1806
    it('should return the canonical type', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/organizations/1')
        .set('Accept', 'application/json')
        .expect(200);
      should(res.body.type).equal('SPELEOLOGY');
    });

    it('should return a null type for an organization whose type is not set', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/organizations/3')
        .set('Accept', 'application/json')
        .expect(200);
      should(res.body).have.property('type', null);
    });

    // https://github.com/GrottoCenter/grottocenter-api/issues/1923
    it('should return OTHER unchanged', async () => {
      // Organization 2 is an EDITION in the fixtures
      await TGrotto.updateOne({ id: 2 }).set({ type: 'OTHER' });
      try {
        const res = await supertest(sails.hooks.http.app)
          .get('/api/v1/organizations/2')
          .set('Accept', 'application/json')
          .expect(200);
        should(res.body.type).equal('OTHER');
      } finally {
        await TGrotto.updateOne({ id: 2 }).set({ type: 'EDITION' });
      }
    });

    it('should expose authored and published documents as separate lists', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/organizations/1')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: organization } = res;
          should(organization.authoredDocuments).be.an.Array();
          should(organization.publishedDocuments).be.an.Array();
          should(organization.authoredCount).be.a.Number();
          should(organization.publishedCount).be.a.Number();
          // Replaced by the two lists above.
          should(organization).not.have.property('documents');
          return done();
        });
    });
  });

  describe('Count', () => {
    const COUNTED_TYPES = [
      ORGANIZATION_TYPES.SPELEOLOGY,
      ORGANIZATION_TYPES.CAVE_RESCUE,
    ];

    const count = async () => {
      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/organizations/count')
        .set('Accept', 'application/json')
        .expect(200);
      should(res.body.count).be.a.Number();
      return res.body.count;
    };

    it('should count only non-deleted speleology and cave rescue organizations', async () => {
      const before = await count();
      const created = await TGrotto.createEach([
        ...ORGANIZATION_TYPE_VALUES.map((type) => ({ author: 1, type })),
        { author: 1, type: null },
        ...COUNTED_TYPES.map((type) => ({ author: 1, type, isDeleted: true })),
      ]).fetch();
      try {
        should(await count()).equal(before + COUNTED_TYPES.length);
      } finally {
        await TGrotto.destroy({ id: created.map((o) => o.id) });
      }
    });

    it('should return zero when no organization is counted', async () => {
      const counted = await TGrotto.find({
        where: { isDeleted: false, type: { in: COUNTED_TYPES } },
        select: ['id'],
      });
      const ids = counted.map((o) => o.id);
      await TGrotto.update({ id: ids }).set({ isDeleted: true });
      try {
        should(await count()).equal(0);
      } finally {
        await TGrotto.update({ id: ids }).set({ isDeleted: false });
      }
    });
  });
});
