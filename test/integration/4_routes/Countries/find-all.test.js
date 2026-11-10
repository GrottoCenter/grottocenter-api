const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');
const CommonService = require('../../../../api/services/CommonService');

const getCountries = () =>
  supertest(sails.hooks.http.app)
    .get('/api/v1/countries')
    .set('Accept', 'application/json')
    .expect(200);

const getStatistics = (countryId) =>
  supertest(sails.hooks.http.app)
    .get(`/api/v1/countries/${countryId}/statistics`)
    .set('Accept', 'application/json')
    .expect(200);

const countOf = (body, countryId) =>
  body.countries.find((c) => c.id === countryId).nb_entrances;

describe('Country find-all (GET /api/v1/countries)', () => {
  it('returns every country, without the 00 placeholder, sorted by id', async () => {
    const { body } = await getCountries();
    should(Object.keys(body)).eql(['countries']);
    const ids = body.countries.map((c) => c.id);
    should(ids).containDeep(['ES', 'FR', 'GB', 'US']);
    should(ids).not.containEql('00');
    should(ids).eql([...ids].sort());
  });

  it('gives each country an integer nb_entrances and no nb_caves', async () => {
    const { body } = await getCountries();
    body.countries.forEach((country) => {
      should(Object.keys(country).sort()).eql(['id', 'nb_entrances']);
      should(Number.isInteger(country.nb_entrances)).be.true();
    });
  });

  it('returns 0 for a country with no entrance', async () => {
    const { body } = await getCountries();
    should(countOf(body, 'GB')).equal(0);
  });

  describe('with a network of 3 entrances and a deleted entrance', () => {
    const entranceIds = [];
    let caveId;
    let esBefore;

    before(async () => {
      esBefore = countOf((await getCountries()).body, 'ES');
      caveId = (await TCave.create({ author: 1 }).fetch()).id;
      const entrance = {
        author: 1,
        cave: caveId,
        country: 'ES',
        isSensitive: false,
        latitude: '40.1',
        longitude: '-3.1',
      };
      const entrances = await TEntrance.createEach([
        { ...entrance },
        { ...entrance },
        { ...entrance },
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

    it('counts entrances, not caves, and skips the deleted one', async () => {
      const { body } = await getCountries();
      should(countOf(body, 'ES')).equal(esBefore + 3);
    });

    it('matches nb_entrances of the country statistics', async () => {
      const [{ body: list }, { body: stats }] = await Promise.all([
        getCountries(),
        getStatistics('ES'),
      ]);
      should(stats.nb_entrances).equal(countOf(list, 'ES'));
    });
  });

  describe('when the query fails', () => {
    let CountryService;

    before(() => {
      // eslint-disable-next-line global-require
      CountryService = require('../../../../api/services/CountryService');
    });

    it('answers 500', async () => {
      const stub = sinon
        .stub(CountryService, 'getEntranceCountsByCountry')
        .rejects(new Error('DB error'));
      try {
        await supertest(sails.hooks.http.app)
          .get('/api/v1/countries')
          .set('Accept', 'application/json')
          .expect(500);
        should(stub.callCount).equal(1);
      } finally {
        stub.restore();
      }
    });
  });
});
