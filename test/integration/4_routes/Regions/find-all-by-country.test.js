const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');
const CommonService = require('../../../../api/services/CommonService');

const getRegions = (countryId) =>
  supertest(sails.hooks.http.app)
    .get(`/api/v1/countries/${countryId}/regions`)
    .set('Accept', 'application/json');

const getStatistics = (countryId, regionId) =>
  supertest(sails.hooks.http.app)
    .get(`/api/v1/countries/${countryId}/regions/${regionId}/statistics`)
    .set('Accept', 'application/json')
    .expect(200);

const countOf = (body, regionId) =>
  body.regions.find((r) => r.id === regionId).nb_entrances;

describe('Region find-all-by-country (GET /api/v1/countries/:countryId/regions)', () => {
  it('answers 404 for a country that does not exist', async () => {
    const { body } = await getRegions('XX').expect(404);
    should(body.message).containEql('XX');
  });

  it('returns an empty list for a country with no region', async () => {
    const { body } = await getRegions('GB').expect(200);
    should(body).eql({ regions: [] });
  });

  it('returns the regions of the country with their full ISO 3166-2 code', async () => {
    const { body } = await getRegions('FR').expect(200);
    should(Object.keys(body)).eql(['regions']);
    should(body.regions.map((r) => r.id)).containEql('FR-01');
    body.regions.forEach((region) => {
      should(region.id.startsWith('FR-')).be.true();
      should(Object.keys(region).sort()).eql(['id', 'name', 'nb_entrances']);
      should(Number.isInteger(region.nb_entrances)).be.true();
    });
    should(body.regions.find((r) => r.id === 'FR-01').name).equal('Ain');
  });

  describe('with a network of 3 entrances and a deleted entrance', () => {
    const entranceIds = [];
    let caveId;
    let fr01Before;

    before(async () => {
      fr01Before = countOf((await getRegions('FR').expect(200)).body, 'FR-01');
      caveId = (await TCave.create({ author: 1 }).fetch()).id;
      const entrance = {
        author: 1,
        cave: caveId,
        country: 'FR',
        iso_3166_2: 'FR-01',
        isSensitive: false,
        latitude: '46.1',
        longitude: '5.4',
      };
      const entrances = await TEntrance.createEach([
        { ...entrance },
        { ...entrance },
        { ...entrance, isSensitive: true },
        { ...entrance, isDeleted: true },
      ]).fetch();
      entranceIds.push(...entrances.map((e) => e.id));
    });

    after(async () => {
      await CommonService.query('DELETE FROM t_entrance WHERE id = ANY($1)', [
        entranceIds,
      ]);
      await CommonService.query('DELETE FROM t_cave WHERE id = $1', [caveId]);
    });

    it('counts entrances, sensitive ones included, and skips the deleted one', async () => {
      const { body } = await getRegions('FR').expect(200);
      should(countOf(body, 'FR-01')).equal(fr01Before + 3);
    });

    it('matches nb_entrances of the region statistics', async () => {
      const [{ body: list }, { body: stats }] = await Promise.all([
        getRegions('FR').expect(200),
        getStatistics('FR', '01'),
      ]);
      should(stats.nb_entrances).equal(countOf(list, 'FR-01'));
    });
  });

  describe('when the query fails', () => {
    let RegionService;

    before(() => {
      // eslint-disable-next-line global-require
      RegionService = require('../../../../api/services/RegionService');
    });

    it('answers 500', async () => {
      const stub = sinon
        .stub(RegionService, 'getEntranceCountsByCountry')
        .rejects(new Error('DB error'));
      try {
        await getRegions('FR').expect(500);
        should(stub.callCount).equal(1);
      } finally {
        stub.restore();
      }
    });
  });
});
