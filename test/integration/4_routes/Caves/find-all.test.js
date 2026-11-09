const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');
const deletedListTests = require('../_helpers/deletedListTests');

// https://github.com/GrottoCenter/grottocenter-api/issues/1931
describe('Cave find-all', () => {
  const created = { caves: [], entrances: [] };

  const createCave = async (attributes, name) => {
    const cave = await TCave.create({ author: 1, ...attributes }).fetch();
    created.caves.push(cave.id);
    if (name) {
      await TName.create({
        author: 1,
        cave: cave.id,
        name,
        language: 'fra',
        isMain: true,
      });
    }
    return cave;
  };

  const createEntrance = async (attributes) => {
    const entrance = await TEntrance.create({
      author: 1,
      latitude: 45.2,
      longitude: 5.2,
      ...attributes,
    }).fetch();
    created.entrances.push(entrance.id);
    return entrance;
  };

  const cleanup = async () => {
    await TName.destroy({ cave: created.caves });
    await TEntrance.destroy({ id: created.entrances });
    await TCave.destroy({ id: created.caves });
  };

  // Every row of a list, page after page.
  const listAll = async (params, token) => {
    const rows = [];
    for (let skip = 0; ; skip += 100) {
      // eslint-disable-next-line no-await-in-loop
      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/caves')
        .query({ limit: 100, skip, ...params })
        .set('Authorization', token);
      if (res.status !== 206) return rows;
      rows.push(...res.body.caves);
    }
  };

  deletedListTests({
    path: '/api/v1/caves',
    key: 'caves',
    model: () => TCave,
    seed: async () => {
      const active = await createCave({}, 'Active list cave');
      // A network: two entrances.
      await createEntrance({ cave: active.id });
      await createEntrance({ cave: active.id });
      // Deleted with no entrance left, merged into the active cave.
      const merged = await createCave(
        { isDeleted: true, redirectTo: active.id },
        'Merged list cave'
      );
      // Deleted with a single entrance.
      const single = await createCave({ isDeleted: true }, 'Single list cave');
      await createEntrance({ cave: single.id, isDeleted: true });
      return {
        activeIds: [active.id],
        deletedIds: [merged.id, single.id],
        mergedId: merged.id,
        mergedInto: active.id,
      };
    },
    cleanup,
  });

  describe('cave semantics', () => {
    let userToken;
    let moderatorToken;
    let adminToken;

    before(async () => {
      userToken = await AuthTokenService.getRawBearerUserToken();
      moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
      adminToken = await AuthTokenService.getRawBearerAdminToken();
    });

    after(cleanup);

    it('should keep listing a cave whose entrances are all soft-deleted as active', async () => {
      const cave = await createCave({}, 'Cave of deleted entrances');
      await createEntrance({ cave: cave.id, isDeleted: true });
      const active = await listAll({}, userToken);
      const row = active.find((c) => c.id === cave.id);
      should(row).be.an.Object();
      should(row.isDeleted).be.false();
      should(row.nbEntrances).equal(1);
      const deleted = await listAll({ isDeleted: 'true' }, moderatorToken);
      should(deleted.map((c) => c.id)).not.containEql(cave.id);
    });

    // Moving the last entrance of a cave away soft-deletes the cave and
    // redirects it to the destination (CaveLifecycleService.moveEntranceToCave).
    // The test database has no soft-delete trigger, so the move itself removes
    // the row there: build the state it leaves in production instead.
    it('should list an emptied cave redirected to the destination of its entrance', async () => {
      const destination = await createCave({}, 'Destination list cave');
      await createEntrance({ cave: destination.id });
      const source = await createCave(
        { isDeleted: true, redirectTo: destination.id },
        'Emptied list cave'
      );

      const deleted = await listAll({ isDeleted: 'true' }, adminToken);
      const row = deleted.find((c) => c.id === source.id);
      should(row).be.an.Object();
      should(row).have.properties({
        name: 'Emptied list cave',
        language: 'fra',
        isDeleted: true,
        redirectTo: destination.id,
        nbEntrances: 0,
        entrances: [],
      });
      should(row).have.property('dateInscription');

      const active = await listAll({}, adminToken);
      should(active.map((c) => c.id)).not.containEql(source.id);
    });
  });
});
