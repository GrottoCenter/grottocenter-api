const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');

const AuthTokenService = require('../../AuthTokenService');
const EnrichmentQueueService = require('../../../../api/services/EnrichmentQueueService');

// A square no other test uses
const POLYGON =
  'SRID=4326;POLYGON((150 -40, 151 -40, 151 -39, 150 -39, 150 -40))';
const INSIDE = { latitude: -39.5, longitude: 150.5 };
const OUTSIDE = { latitude: -30, longitude: 100 };

describe('Entrance update - sensitivity inherited from the massif', () => {
  let userToken;
  let adminToken;
  let enqueueStub;
  const massifIds = [];
  const entranceIds = [];
  const caveIds = [];

  const createMassif = async (isSensitive) => {
    const massif = await TMassif.create({
      isSensitive,
      author: 1,
      geogPolygon: POLYGON,
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
      ...OUTSIDE,
      isSensitive: false,
      isSensitiveLocked: false,
      ...props,
    }).fetch();
    entranceIds.push(entrance.id);
    return entrance;
  };

  const put = (token, entranceId, body) =>
    supertest(sails.hooks.http.app)
      .put(`/api/v1/entrances/${entranceId}`)
      .set('Authorization', token)
      .set('Content-type', 'application/json')
      .send(body)
      .expect(200);

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    adminToken = await AuthTokenService.getRawBearerAdminToken();
    enqueueStub = sinon.stub(EnrichmentQueueService, 'enqueue').resolves();
  });

  after(() => enqueueStub.restore());

  afterEach(async () => {
    await TName.destroy({ entrance: entranceIds });
    await TEntrance.destroy({ id: entranceIds });
    await TName.destroy({ cave: caveIds });
    await TCave.destroy({ id: caveIds });
    await TMassif.destroy({ id: massifIds });
    entranceIds.length = 0;
    caveIds.length = 0;
    massifIds.length = 0;
  });

  it('marks an entrance sensitive when a user moves it into a sensitive massif', async () => {
    await createMassif(true);
    const entrance = await createEntrance();

    await put(userToken, entrance.id, INSIDE);

    should((await TEntrance.findOne(entrance.id)).isSensitive).be.true();
  }).timeout(10000);

  it('marks it sensitive even when an admin sends isSensitive false with the move', async () => {
    await createMassif(true);
    const entrance = await createEntrance();

    await put(adminToken, entrance.id, { ...INSIDE, isSensitive: false });

    should((await TEntrance.findOne(entrance.id)).isSensitive).be.true();
  }).timeout(10000);

  it('leaves a locked entrance as it is when it is moved into a sensitive massif', async () => {
    await createMassif(true);
    const entrance = await createEntrance({ isSensitiveLocked: true });

    await put(userToken, entrance.id, INSIDE);

    const updated = await TEntrance.findOne(entrance.id);
    should(updated.isSensitive).be.false();
    should(updated.latitude).be.approximately(INSIDE.latitude, 0.0001);
  }).timeout(10000);

  it('lets an admin lock and move an entrance in the same request', async () => {
    await createMassif(true);
    const entrance = await createEntrance();

    await put(adminToken, entrance.id, { ...INSIDE, isSensitiveLocked: true });

    const updated = await TEntrance.findOne(entrance.id);
    should(updated.isSensitive).be.false();
    should(updated.isSensitiveLocked).be.true();
    should(updated.latitude).be.approximately(INSIDE.latitude, 0.0001);
  }).timeout(10000);

  it('does not mark an entrance moved into a non-sensitive massif', async () => {
    await createMassif(false);
    const entrance = await createEntrance();

    await put(userToken, entrance.id, INSIDE);

    should((await TEntrance.findOne(entrance.id)).isSensitive).be.false();
  }).timeout(10000);

  it('does not mark an entrance moved to a place outside every sensitive massif', async () => {
    await createMassif(true);
    const entrance = await createEntrance(INSIDE);

    await put(userToken, entrance.id, { latitude: -20, longitude: 120 });

    should((await TEntrance.findOne(entrance.id)).isSensitive).be.false();
  }).timeout(10000);

  it('leaves an unmark by an admin alone when the coordinates are sent unchanged', async () => {
    await createMassif(true);
    const entrance = await createEntrance({ ...INSIDE, isSensitive: true });

    await put(adminToken, entrance.id, { ...INSIDE, isSensitive: false });

    should((await TEntrance.findOne(entrance.id)).isSensitive).be.false();
  }).timeout(10000);
});
