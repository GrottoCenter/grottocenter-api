const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../AuthTokenService');

/**
 * https://github.com/GrottoCenter/grottocenter-api/issues/1931
 *
 * The deleted content tool, resource by resource: inspect a soft-deleted
 * record (as after a page reload), restore it, delete it permanently. Roles
 * are not hierarchical: an administrator without the Moderator role, and a
 * moderator without the Administrator one, each get the whole workflow but
 * the permanent deletion, which stays an administrator's.
 */

// Properties of the reduced shape (converters.toDeletedEntity) unprivileged
// callers get for some deleted records. A privileged caller gets the full
// record, which has more.
const DELETED_ENTITY_KEYS = [
  'id',
  'isDeleted',
  'redirectTo',
  'author',
  'reviewer',
  'dateInscription',
  'dateReviewed',
  'name',
  'language',
];

const RESOURCES = [
  {
    path: 'organizations',
    model: () => TGrotto,
    create: (attributes) =>
      TGrotto.create({ author: 1, ...attributes }).fetch(),
  },
  {
    path: 'entrances',
    model: () => TEntrance,
    create: async (attributes) => {
      const cave = await TCave.create({ author: 1 }).fetch();
      return TEntrance.create({
        author: 1,
        cave: cave.id,
        latitude: 45.3,
        longitude: 5.3,
        ...attributes,
      }).fetch();
    },
  },
  {
    path: 'massifs',
    model: () => TMassif,
    create: (attributes) =>
      TMassif.create({ author: 1, ...attributes }).fetch(),
  },
  {
    path: 'caves',
    model: () => TCave,
    create: (attributes) => TCave.create({ author: 1, ...attributes }).fetch(),
  },
  {
    path: 'guidelines',
    model: () => TGuideline,
    create: (attributes) =>
      TGuideline.create({
        author: 1,
        language: 'fra',
        title: 'Workflow guideline',
        description: 'A guideline of the deleted content workflow.',
        dateInscription: '2026-05-01T10:00:00.000Z',
        dateReviewed: '2026-05-01T10:00:00.000Z',
        ...attributes,
      }).fetch(),
  },
  {
    path: 'documents',
    model: () => TDocument,
    create: (attributes) =>
      TDocument.create({
        author: 1,
        license: 1,
        type: 18,
        ...attributes,
      }).fetch(),
  },
];

describe('Deleted content workflow', () => {
  const tokens = {};

  before(async () => {
    tokens.user = await AuthTokenService.getRawBearerUserToken();
    tokens.moderator = await AuthTokenService.getRawBearerModeratorToken();
    tokens.admin = await AuthTokenService.getRawBearerAdminToken();
    tokens.all = await AuthTokenService.getRawBearerAllGroupsToken();
  });

  const request = (method, url, token) => {
    const req = supertest(sails.hooks.http.app)
      [method](url)
      .set('Accept', 'application/json');
    return token ? req.set('Authorization', token) : req;
  };

  RESOURCES.forEach(({ path, model, create }) => {
    describe(`/api/v1/${path}`, () => {
      const newDeleted = () => create({ isDeleted: true });

      describe('deleted detail', () => {
        let record;

        before(async () => {
          record = await newDeleted();
        });

        [undefined, 'user'].forEach((role) => {
          it(`should not give the full deleted record to ${
            role ?? 'an anonymous'
          } caller`, async () => {
            const res = await request(
              'get',
              `/api/v1/${path}/${record.id}`,
              tokens[role]
            );
            should([200, 404]).containEql(res.status);
            if (res.status === 200) {
              should(DELETED_ENTITY_KEYS).containDeep(Object.keys(res.body));
            }
          });
        });

        ['moderator', 'admin', 'all'].forEach((role) => {
          it(`should give the full deleted record to the ${role} caller`, async () => {
            const res = await request(
              'get',
              `/api/v1/${path}/${record.id}`,
              tokens[role]
            ).expect(200);
            should(res.body.id).equal(record.id);
            should(res.body.isDeleted).be.true();
            const extraKeys = Object.keys(res.body).filter(
              (k) => !DELETED_ENTITY_KEYS.includes(k)
            );
            should(extraKeys).not.be.empty();
          });
        });
      });

      describe('restore', () => {
        it('should return 403 to an ordinary user and leave the record deleted', async () => {
          const record = await newDeleted();
          await request(
            'post',
            `/api/v1/${path}/${record.id}/restore`,
            tokens.user
          ).expect(403);
          should((await model().findOne(record.id)).isDeleted).be.true();
        });

        ['moderator', 'admin'].forEach((role) => {
          it(`should let the ${role}-only caller restore`, async () => {
            const record = await newDeleted();
            await request(
              'post',
              `/api/v1/${path}/${record.id}/restore`,
              tokens[role]
            ).expect(200);
            should((await model().findOne(record.id)).isDeleted).be.false();
          });
        });
      });

      describe('permanent delete', () => {
        it('should reject a moderator-only caller before any write', async () => {
          const record = await newDeleted();
          await request(
            'delete',
            `/api/v1/${path}/${record.id}?isPermanent=true`,
            tokens.moderator
          ).expect(403);
          const after = await model().findOne(record.id);
          should(after).be.an.Object();
          should(after.isDeleted).be.true();
        });

        it('should let an administrator-only caller delete permanently', async () => {
          const record = await newDeleted();
          await request(
            'delete',
            `/api/v1/${path}/${record.id}?isPermanent=true`,
            tokens.admin
          ).expect(200);
          should(await model().findOne(record.id)).be.undefined();
        });
      });
    });
  });
});
