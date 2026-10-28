const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

// A pair of nested squares no other test uses: the entrances sit in the ring
// between the small one and the large one.
const SMALL =
  'SRID=4326;POLYGON((150 -40, 151 -40, 151 -39, 150 -39, 150 -40))';
const LARGE = {
  type: 'Polygon',
  coordinates: [
    [
      [150, -40],
      [152, -40],
      [152, -39],
      [150, -39],
      [150, -40],
    ],
  ],
};
const LARGE_WKT =
  'SRID=4326;POLYGON((150 -40, 152 -40, 152 -39, 150 -39, 150 -40))';
const PRECISE_WKT =
  'SRID=4326;POLYGON((150.123456789012345 -40.123456789012345, 152.123456789012345 -40.123456789012345, 152.123456789012345 -39.123456789012345, 150.123456789012345 -39.123456789012345, 150.123456789012345 -40.123456789012345))';
const IN_RING = { latitude: -39.5, longitude: 151.5 };

describe('Massif update - sensitivity propagated when the polygon grows', () => {
  let userToken;
  const massifIds = [];
  const entranceIds = [];
  const caveIds = [];

  const createMassif = async (isSensitive, geogPolygon = SMALL) => {
    const massif = await TMassif.create({
      isSensitive,
      author: 1,
      ...(geogPolygon && { geogPolygon }),
    }).fetch();
    massifIds.push(massif.id);
    return massif;
  };

  const createEntrance = async (props = {}) => {
    const cave = await TCave.create({ author: 1 }).fetch();
    caveIds.push(cave.id);
    const entrance = await TEntrance.create({
      author: 1,
      cave: cave.id,
      ...IN_RING,
      isSensitive: false,
      isSensitiveLocked: false,
      ...props,
    }).fetch();
    entranceIds.push(entrance.id);
    // The test database has no trigger filling point_geom
    await CommonService.query(
      'UPDATE t_entrance SET point_geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) WHERE id = $1',
      [entrance.id]
    );
    return entrance;
  };

  const grow = (massifId) =>
    supertest(sails.hooks.http.app)
      .put(`/api/v1/massifs/${massifId}`)
      .set('Authorization', userToken)
      .set('Content-type', 'application/json')
      .send({ geogPolygon: LARGE })
      .expect(200);

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  afterEach(async () => {
    await TEntrance.destroy({ id: entranceIds });
    await TCave.destroy({ id: caveIds });
    await TMassif.destroy({ id: massifIds });
    entranceIds.length = 0;
    caveIds.length = 0;
    massifIds.length = 0;
  });

  it('marks the public entrances the larger polygon encloses as sensitive, leaving no violation', async () => {
    const massif = await createMassif(true);
    const entrance = await createEntrance();

    await grow(massif.id);

    should((await TEntrance.findOne(entrance.id)).isSensitive).be.true();
    const { rows } = await CommonService.query(
      'SELECT * FROM bot_cascade_check()'
    );
    should(rows[0].violation_ids).not.containEql(entrance.id);
  }).timeout(10000);

  it('leaves a locked entrance public', async () => {
    const massif = await createMassif(true);
    const entrance = await createEntrance({ isSensitiveLocked: true });

    await grow(massif.id);

    should((await TEntrance.findOne(entrance.id)).isSensitive).be.false();
  }).timeout(10000);

  it('does not mark anything when the massif is not sensitive', async () => {
    const massif = await createMassif(false);
    const entrance = await createEntrance();

    await grow(massif.id);

    should((await TEntrance.findOne(entrance.id)).isSensitive).be.false();
  }).timeout(10000);

  it('does not mark an entrance that stays outside the new polygon', async () => {
    const massif = await createMassif(true);
    const entrance = await createEntrance({ latitude: -30, longitude: 100 });

    await grow(massif.id);

    should((await TEntrance.findOne(entrance.id)).isSensitive).be.false();
  }).timeout(10000);

  it('does not propagate when the same polygon is sent again', async () => {
    const massif = await createMassif(true, LARGE_WKT);
    // An administrator unmarked this entrance on purpose
    const entrance = await createEntrance();

    await grow(massif.id);

    should((await TEntrance.findOne(entrance.id)).isSensitive).be.false();
  }).timeout(10000);

  it('does not propagate when the client sends back the polygon it was served', async () => {
    // Drawn polygons are stored with about 15 digits; the API serves 9
    const massif = await createMassif(true, PRECISE_WKT);
    const entrance = await createEntrance();

    const served = await supertest(sails.hooks.http.app)
      .get(`/api/v1/massifs/${massif.id}`)
      .expect(200);
    const polygon =
      typeof served.body.geogPolygon === 'string'
        ? JSON.parse(served.body.geogPolygon)
        : served.body.geogPolygon;
    await supertest(sails.hooks.http.app)
      .put(`/api/v1/massifs/${massif.id}`)
      .set('Authorization', userToken)
      .set('Content-type', 'application/json')
      .send({ geogPolygon: polygon })
      .expect(200);

    should((await TEntrance.findOne(entrance.id)).isSensitive).be.false();
  }).timeout(10000);

  it('propagates when a sensitive massif that had no polygon gets one', async () => {
    const massif = await createMassif(true, null);
    const entrance = await createEntrance();

    await grow(massif.id);

    should((await TEntrance.findOne(entrance.id)).isSensitive).be.true();
  }).timeout(10000);

  it('does not propagate when the update leaves the polygon alone', async () => {
    const massif = await createMassif(true);
    // Already inside the polygon, so only a polygon change can mark it
    const entrance = await createEntrance({ longitude: 150.5 });

    await supertest(sails.hooks.http.app)
      .put(`/api/v1/massifs/${massif.id}`)
      .set('Authorization', userToken)
      .set('Content-type', 'application/json')
      .send({})
      .expect(200);

    should((await TEntrance.findOne(entrance.id)).isSensitive).be.false();
  }).timeout(10000);
});
