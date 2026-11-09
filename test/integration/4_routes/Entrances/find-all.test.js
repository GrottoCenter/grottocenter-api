const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');
const deletedListTests = require('../_helpers/deletedListTests');

// https://github.com/GrottoCenter/grottocenter-api/issues/1931
describe('Entrance find-all', () => {
  const created = { entrances: [] };

  const createEntrance = async (attributes, name) => {
    const entrance = await TEntrance.create({
      author: 1,
      cave: 1,
      latitude: 45.1,
      longitude: 5.1,
      ...attributes,
    }).fetch();
    created.entrances.push(entrance.id);
    await TName.create({
      author: 1,
      entrance: entrance.id,
      name,
      language: 'fra',
      isMain: true,
    });
    return entrance;
  };

  const cleanup = async () => {
    await TName.destroy({ entrance: created.entrances });
    await TEntrance.destroy({ id: created.entrances });
  };

  deletedListTests({
    path: '/api/v1/entrances',
    key: 'entrances',
    model: () => TEntrance,
    seed: async () => {
      const active = await createEntrance({}, 'Active list entrance');
      const deleted = await createEntrance(
        { isDeleted: true },
        'Deleted list entrance'
      );
      const merged = await createEntrance(
        { isDeleted: true, redirectTo: active.id },
        'Merged list entrance'
      );
      return {
        activeIds: [active.id],
        deletedIds: [deleted.id, merged.id],
        mergedId: merged.id,
        mergedInto: active.id,
      };
    },
    cleanup,
  });

  describe('rows', () => {
    let moderatorToken;
    let adminToken;
    let sensitive;

    // Walk the pages until the record shows up.
    const find = async (id, params, token) => {
      for (let skip = 0; ; skip += 100) {
        // eslint-disable-next-line no-await-in-loop
        const res = await supertest(sails.hooks.http.app)
          .get('/api/v1/entrances')
          .query({ limit: 100, skip, ...params })
          .set('Authorization', token);
        if (res.status !== 206) return undefined;
        const row = res.body.entrances.find((e) => e.id === id);
        if (row) return row;
      }
    };

    before(async () => {
      moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
      adminToken = await AuthTokenService.getRawBearerAdminToken();
      sensitive = await createEntrance(
        { isDeleted: true, isSensitive: true },
        'Sensitive deleted entrance'
      );
    });

    after(cleanup);

    it('should carry the summary fields of an entrance', async () => {
      const row = await find(sensitive.id, { isDeleted: 'true' }, adminToken);
      should(row).have.properties({
        id: sensitive.id,
        name: 'Sensitive deleted entrance',
        language: 'fra',
        cave: 1,
        isDeleted: true,
        isSensitive: true,
        redirectTo: null,
      });
      should(row).have.property('dateInscription');
      should(row).have.property('dateReviewed');
    });

    it('should keep the coordinates of a sensitive entrance from a moderator', async () => {
      const row = await find(
        sensitive.id,
        { isDeleted: 'true' },
        moderatorToken
      );
      should(row.latitude).be.null();
      should(row.longitude).be.null();
    });

    it('should give the coordinates of a sensitive entrance to an administrator', async () => {
      const row = await find(sensitive.id, { isDeleted: 'true' }, adminToken);
      should(row.latitude).equal(45.1);
      should(row.longitude).equal(5.1);
    });
  });
});
