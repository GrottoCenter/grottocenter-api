const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

// eslint-disable-next-line no-control-regex
const FORBIDDEN = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\uFFFE\uFFFF]/;

// Parsed JSON strings hold the raw characters. Checking `JSON.stringify` output
// instead would never fail: it escapes control characters to ASCII `\u00XX`.
const findForbidden = (value) => {
  if (typeof value === 'string') return FORBIDDEN.test(value) ? [value] : [];
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(findForbidden);
  }
  return [];
};

/**
 * The OAI server turns these responses into XML, which cannot hold control
 * characters. Goes through the real controllers (and the helper that copies
 * records), so a lost `customToJSON` is caught.
 */
describe('Bibliographic Metadata control characters', () => {
  const RECORD_ID = 1;
  let adminToken;
  let original;

  before(async () => {
    adminToken = await AuthTokenService.getRawBearerAdminToken();
    original = await sails.models.vbibliographicmetadata.findOne({
      id: RECORD_ID,
    });
    await sails.models.vbibliographicmetadata.updateOne({ id: RECORD_ID }).set({
      dcTitle: 'Ti\x1ftle\x1e\uFFFE',
      dcCreators: ['Au\x1dthor'],
    });
  });

  after(async () => {
    await sails.models.vbibliographicmetadata
      .updateOne({ id: RECORD_ID })
      .set({ dcTitle: original.dcTitle, dcCreators: original.dcCreators });
  });

  it('strips them from GET /record/:id', async () => {
    const res = await supertest(sails.hooks.http.app)
      .get(`/api/v1/bibliographic-metadata/record/${RECORD_ID}`)
      .set('Authorization', adminToken)
      .expect(200);

    should(res.body.dcTitle).equal('Title');
    should(res.body.dcCreators).eql(['Author']);
    should(findForbidden(res.body)).eql([]);
  });

  it('strips them from GET /records', async () => {
    const res = await supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/records')
      .set('Authorization', adminToken)
      .expect(200);

    const record = res.body.records.find((r) => r.id === RECORD_ID);
    should(record.dcTitle).equal('Title');
    should(findForbidden(res.body)).eql([]);
  });
});
