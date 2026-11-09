const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

/**
 * Contract shared by the core collections that list their soft-deleted
 * records (#1931): GET /organizations, /entrances, /massifs, /caves,
 * /guidelines and /documents.
 *
 * - no `isDeleted` or `isDeleted=false`: active records only, for anyone;
 * - `isDeleted=true`: deleted records only (merged ones included), for an
 *   administrator or a moderator, 403 for anyone else;
 * - `skip` (default 0, min 0) and `limit` (default 50, between 1 and 100);
 * - 206 with `Content-Range: skip-to/total` on a non-empty page, 200 with an
 *   empty array otherwise, the total counting the filtered records.
 *
 * @param {object} options
 * @param {string} options.path collection path
 * @param {string} options.key wrapper key of the answer
 * @param {Function} options.model () => the Waterline model behind the
 *   collection (models are globals defined only once Sails lifted)
 * @param {object} [options.query] extra query parameters sent with every
 *   request (to pick a deterministic order where the default is not id ASC)
 * @param {object} [options.deletedWhere] criteria counting the deleted total
 * @param {boolean} [options.hasRedirect] whether the records can be merged
 *   (`redirectTo`); the seed then returns `mergedId` and `mergedInto`
 * @param {Function} options.seed async () => ({ activeIds, deletedIds,
 *   mergedId?, mergedInto? }) creating the records of the suite
 * @param {Function} options.cleanup async (seeded) => void
 */
const deletedListTests = ({
  path,
  key,
  model,
  query = {},
  deletedWhere = { isDeleted: true },
  hasRedirect = true,
  seed,
  cleanup,
}) => {
  const tokens = {};
  let seeded;

  const list = (params, token) => {
    const request = supertest(sails.hooks.http.app)
      .get(path)
      .query({ ...query, ...params })
      .set('Accept', 'application/json');
    return token ? request.set('Authorization', token) : request;
  };

  // Content-Range: <skip>-<rangeTo>/<total>
  const parseContentRange = (res) => {
    const header = res.headers['content-range'];
    should(header).be.a.String();
    const [, from, to, total] = header.match(/^(\d+)-(\d+)\/(\d+)$/);
    return { from: Number(from), to: Number(to), total: Number(total) };
  };

  // Walk every page of one record each, as a client would.
  const traverse = async (params, token) => {
    const ids = [];
    let total = 0;
    for (let skip = 0; ; skip += 1) {
      // eslint-disable-next-line no-await-in-loop
      const res = await list({ ...params, limit: 1, skip }, token);
      if (res.status === 200) {
        should(res.body[key]).eql([]);
        break;
      }
      should(res.status).equal(206);
      should(res.body[key]).have.length(1);
      const range = parseContentRange(res);
      should(range.from).equal(skip);
      should(range.to).equal(skip + 1);
      ({ total } = range);
      ids.push(res.body[key][0].id);
    }
    return { ids, total };
  };

  describe(`GET ${path} — deleted-record listing contract`, () => {
    before(async () => {
      tokens.user = await AuthTokenService.getRawBearerUserToken();
      tokens.moderator = await AuthTokenService.getRawBearerModeratorToken();
      tokens.admin = await AuthTokenService.getRawBearerAdminToken();
      tokens.all = await AuthTokenService.getRawBearerAllGroupsToken();
      seeded = await seed();
    });

    after(async () => {
      if (seeded) await cleanup(seeded);
    });

    describe('active records (default)', () => {
      it('should list active records only, under the wrapper key', async () => {
        const res = await list({}, tokens.all).expect(206);
        should(res.body[key]).be.an.Array().and.not.be.empty();
        const ids = res.body[key].map((r) => r.id);
        for (const row of res.body[key]) should(row.isDeleted).be.false();
        for (const id of seeded.deletedIds) should(ids).not.containEql(id);
      });

      it('should treat isDeleted=false and isDeleted=0 like the default', async () => {
        const [byDefault, asFalse, asZero] = await Promise.all([
          list().expect(206),
          list({ isDeleted: 'false' }).expect(206),
          list({ isDeleted: '0' }).expect(206),
        ]);
        should(asFalse.body[key]).eql(byDefault.body[key]);
        should(asZero.body[key]).eql(byDefault.body[key]);
      });

      it('should default to skip 0 and limit 50', async () => {
        const res = await list().expect(206);
        const { from, to, total } = parseContentRange(res);
        should(from).equal(0);
        should(to).equal(Math.min(50, total));
        should(res.body[key]).have.length(Math.min(50, total));
      });

      it('should page through every active record exactly once', async () => {
        const { ids, total } = await traverse({});
        should(ids.length).equal(total);
        should(new Set(ids).size).equal(ids.length);
        for (const id of seeded.activeIds) should(ids).containEql(id);
        for (const id of seeded.deletedIds) should(ids).not.containEql(id);
      });
    });

    describe('deleted records (isDeleted=true)', () => {
      it('should return 403 to an anonymous caller', async () => {
        await list({ isDeleted: 'true' }).expect(403);
      });

      it('should return 403 to an ordinary user', async () => {
        await list({ isDeleted: 'true' }, tokens.user).expect(403);
      });

      ['moderator', 'admin', 'all'].forEach((role) => {
        it(`should list the deleted records only to the ${role} caller`, async () => {
          const res = await list({ isDeleted: '1' }, tokens[role]).expect(206);
          const ids = res.body[key].map((r) => r.id);
          for (const row of res.body[key]) should(row.isDeleted).be.true();
          for (const id of seeded.activeIds) should(ids).not.containEql(id);
          const { total } = parseContentRange(res);
          should(total).equal(await model().count(deletedWhere));
        });

        it(`should let the ${role} caller traverse every deleted page`, async () => {
          const { ids, total } = await traverse(
            { isDeleted: 'true' },
            tokens[role]
          );
          should(ids.length).equal(total);
          should(new Set(ids).size).equal(ids.length);
          for (const id of seeded.deletedIds) should(ids).containEql(id);
          for (const id of seeded.activeIds) should(ids).not.containEql(id);
        });
      });

      if (hasRedirect) {
        it('should include a merged record with its redirect target', async () => {
          const page = await list(
            { isDeleted: 'true', limit: 100 },
            tokens.moderator
          ).expect(206);
          const merged = page.body[key].find((r) => r.id === seeded.mergedId);
          should(merged).be.an.Object();
          should(merged.isDeleted).be.true();
          should(merged.redirectTo).equal(seeded.mergedInto);
        });
      }

      it('should return 200 with an empty list past the last deleted page', async () => {
        const res = await list(
          { isDeleted: 'true', skip: 100000 },
          tokens.moderator
        ).expect(200);
        should(res.body[key]).eql([]);
      });
    });

    describe('pagination bounds', () => {
      it('should apply skip and limit to the filtered list', async () => {
        const all = await list({ limit: 100 }).expect(206);
        const page = await list({ limit: 2, skip: 1 }).expect(206);
        should(page.body[key]).eql(all.body[key].slice(1, 3));
        const { from, to, total } = parseContentRange(page);
        should(from).equal(1);
        should(to).equal(Math.min(3, total));
      });

      it('should raise limit to 1', async () => {
        const res = await list({ limit: 0 }).expect(206);
        should(res.body[key]).have.length(1);
      });

      it('should cap limit at 100', async () => {
        const res = await list({ limit: 500 }).expect(206);
        should(res.body[key].length).be.lessThanOrEqual(100);
        const { to, total } = parseContentRange(res);
        should(to).equal(Math.min(100, total));
      });

      it('should raise a negative skip to 0', async () => {
        const [first, negative] = await Promise.all([
          list({ skip: 0, limit: 2 }).expect(206),
          list({ skip: -5, limit: 2 }).expect(206),
        ]);
        should(negative.body[key]).eql(first.body[key]);
      });

      it('should return 200 with an empty list past the last page', async () => {
        const res = await list({ skip: 100000 }).expect(200);
        should(res.body[key]).eql([]);
      });
    });

    describe('validation', () => {
      it('should return a structured 400 on an invalid isDeleted', async () => {
        const res = await list({ isDeleted: 'maybe' }, tokens.moderator).expect(
          400
        );
        should(res.body.metadata.field).equal('isDeleted');
        should(res.body.metadata.value).equal('maybe');
      });

      it('should validate isDeleted before checking the role', async () => {
        await list({ isDeleted: 'nope' }).expect(400);
      });
    });
  });
};

module.exports = deletedListTests;
