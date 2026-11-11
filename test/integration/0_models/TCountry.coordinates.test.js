const fs = require('fs');
const path = require('path');
const should = require('should');
const supertest = require('supertest');
const { forTestDatabase } = require('../../customSQL');

// #1699: GE, VA and SO were placed on a homonym (the US state of Georgia, a
// place in Texas, Somaliland), so the map of their country page showed it.
const MIGRATION = forTestDatabase(
  fs.readFileSync(
    path.join(
      __dirname,
      '../../../sql/9_41_2026_11_11_country_coordinates.sql'
    ),
    'utf8'
  )
);
const SEED = fs.readFileSync(
  path.join(__dirname, '../../../sql/2_2021_09_22_4_countries.sql'),
  'utf8'
);

const COUNTRIES = [
  {
    id: 'GE',
    iso3: 'GEO',
    numeric: 268,
    nativeName: 'საქართველო',
    wrong: [32.1574351, -82.907123],
    // Georgia lies between 41-44 N and 40-47 E
    box: { lat: [41, 44], lon: [40, 47] },
  },
  {
    id: 'VA',
    iso3: 'VAT',
    numeric: 336,
    nativeName: 'Sancta Sedes',
    wrong: [30.0337427, -95.8116677],
    box: { lat: [41.89, 41.91], lon: [12.44, 12.46] },
  },
  {
    id: 'SO',
    iso3: 'SOM',
    numeric: 706,
    nativeName: 'Somalia',
    wrong: [9.9869867, 45.2993862],
    // The centre of Somalia, not of Somaliland (north of 8 N)
    box: { lat: [2, 7], lon: [43, 49] },
  },
];

const IDS = COUNTRIES.map((c) => c.id);

const runMigration = () => sails.getDatastore().sendNativeQuery(MIGRATION);

const shouldBeIn = (lat, lon, box) => {
  should(lat).be.within(box.lat[0], box.lat[1]);
  should(lon).be.within(box.lon[0], box.lon[1]);
};

describe('Country coordinates (#1699)', () => {
  before(async () => {
    await TCountry.destroy({ id: IDS });
    await TCountry.createEach(
      COUNTRIES.map(({ id, iso3, numeric, nativeName, wrong }) => ({
        id,
        iso3,
        numeric,
        nativeName,
        latitude: String(wrong[0]),
        longitude: String(wrong[1]),
      }))
    );
  });

  after(async () => {
    await TCountry.destroy({ id: IDS });
  });

  it('moves each country from its homonym to its own centre', async () => {
    await runMigration();
    const rows = await TCountry.find({ id: IDS });
    should(rows).have.length(COUNTRIES.length);
    COUNTRIES.forEach(({ id, box }) => {
      const row = rows.find((r) => r.id === id);
      shouldBeIn(parseFloat(row.latitude), parseFloat(row.longitude), box);
    });
  });

  it('serves the country page map in Georgia, not in the US state', async () => {
    const res = await supertest(sails.hooks.http.app)
      .get('/api/v1/countries/GE')
      .set('Accept', 'application/json')
      .expect(200);
    shouldBeIn(res.body.latitude, res.body.longitude, COUNTRIES[0].box);
  });

  it('keeps a coordinate corrected by hand and can run twice', async () => {
    await TCountry.updateOne({ id: 'GE' }).set({
      latitude: '42',
      longitude: '43.5',
    });
    await runMigration();
    const georgia = await TCountry.findOne({ id: 'GE' });
    should(parseFloat(georgia.latitude)).equal(42);
    should(parseFloat(georgia.longitude)).equal(43.5);
  });

  it('has the right coordinates in the seed of fresh databases', () => {
    COUNTRIES.forEach(({ id, iso3, box }) => {
      const match = SEED.match(
        new RegExp(`\\('${id}', '${iso3}', \\d+, (-?[\\d.]+), (-?[\\d.]+),`)
      );
      should(match).not.be.null();
      shouldBeIn(parseFloat(match[1]), parseFloat(match[2]), box);
    });
  });
});
