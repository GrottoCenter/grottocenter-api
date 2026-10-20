const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

const list = (query, token) => {
  const request = supertest(sails.hooks.http.app)
    .get('/api/v1/organizations')
    .query(query)
    .set('Content-type', 'application/json')
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

describe('Organization find-all', () => {
  let userToken;
  let moderatorToken;
  const deletedIds = [];

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();

    // Fixtures only hold active organizations: create the deleted ones here,
    // including one merged into organization 1.
    const deleted = await TGrotto.createEach([
      { author: 1, isDeleted: true },
      { author: 1, isDeleted: true, redirectTo: 1 },
      { author: 1, isDeleted: true },
    ]).fetch();
    deletedIds.push(...deleted.map((o) => o.id));
  });

  describe('GET /api/v1/organizations', () => {
    describe('active organizations (default)', () => {
      it('should return 206 with active organizations only', async () => {
        const res = await list().expect(206);
        should(res.body).have.property('organizations');
        should(res.body.organizations).be.an.Array();
        should(res.body.organizations).not.be.empty();
        for (const organization of res.body.organizations) {
          should(organization.isDeleted).be.false();
          should(deletedIds).not.containEql(organization.id);
        }
        // https://github.com/GrottoCenter/grottocenter-api/issues/1806
        const first = res.body.organizations.find((o) => o.id === 1);
        should(first).have.property('type', 'SPELEOLOGY');
      });

      it('should default to limit 50 and skip 0', async () => {
        const res = await list().expect(206);
        const { from, to, total } = parseContentRange(res);
        should(from).equal(0);
        should(to).equal(Math.min(50, total));
        should(res.body.organizations.length).equal(Math.min(50, total));
      });

      it('should sort by id ascending', async () => {
        const res = await list().expect(206);
        const ids = res.body.organizations.map((o) => o.id);
        should(ids).eql([...ids].sort((a, b) => a - b));
      });

      it('should treat isDeleted=false like the default', async () => {
        const [byDefault, explicit] = await Promise.all([
          list().expect(206),
          list({ isDeleted: 'false' }).expect(206),
        ]);
        should(explicit.body.organizations).eql(byDefault.body.organizations);
      });

      it('should not include deleted organizations for a moderator', async () => {
        const res = await list({}, moderatorToken).expect(206);
        for (const organization of res.body.organizations) {
          should(organization.isDeleted).be.false();
          should(deletedIds).not.containEql(organization.id);
        }
      });

      it('should count the active organizations only', async () => {
        const res = await list().expect(206);
        const { total } = parseContentRange(res);
        should(total).equal(await TGrotto.count({ isDeleted: false }));
      });
    });

    describe('deleted organizations (isDeleted=true)', () => {
      it('should return 403 for an anonymous caller', async () => {
        await list({ isDeleted: 'true' }).expect(403);
      });

      it('should return 403 for a non-moderator user', async () => {
        await list({ isDeleted: 'true' }, userToken).expect(403);
      });

      it('should return the deleted organizations only to a moderator', async () => {
        const res = await list({ isDeleted: 'true' }, moderatorToken).expect(
          206
        );
        should(res.body.organizations).be.an.Array();
        const ids = res.body.organizations.map((o) => o.id);
        for (const organization of res.body.organizations) {
          should(organization.isDeleted).be.true();
        }
        should(ids).not.containEql(1);
        for (const id of deletedIds) should(ids).containEql(id);
        const { total } = parseContentRange(res);
        should(total).equal(await TGrotto.count({ isDeleted: true }));
      });

      it('should include an organization merged into another one', async () => {
        const merged = await TGrotto.findOne({ id: deletedIds[1] });
        should(merged.redirectTo).equal(1);
        const res = await list({ isDeleted: 'true' }, moderatorToken).expect(
          206
        );
        const found = res.body.organizations.find((o) => o.id === merged.id);
        should(found).be.an.Object();
        should(found.isDeleted).be.true();
      });

      it('should let a moderator traverse every page', async () => {
        const ids = [];
        let total;
        for (let skip = 0; ; skip += 1) {
          // eslint-disable-next-line no-await-in-loop
          const res = await list(
            { isDeleted: 'true', limit: 1, skip },
            moderatorToken
          );
          if (res.status === 200) {
            should(res.body.organizations).eql([]);
            break;
          }
          should(res.status).equal(206);
          should(res.body.organizations).have.length(1);
          const range = parseContentRange(res);
          should(range.from).equal(skip);
          should(range.to).equal(skip + 1);
          ({ total } = range);
          ids.push(res.body.organizations[0].id);
        }
        should(ids.length).equal(total);
        should(new Set(ids).size).equal(ids.length);
        for (const id of deletedIds) should(ids).containEql(id);
        should(ids).eql([...ids].sort((a, b) => a - b));
      });
    });

    describe('pagination bounds', () => {
      it('should apply limit and skip', async () => {
        const all = await list({ limit: 100 }).expect(206);
        const page = await list({ limit: 2, skip: 1 }).expect(206);
        should(page.body.organizations).eql(all.body.organizations.slice(1, 3));
        const { from, to, total } = parseContentRange(page);
        should(from).equal(1);
        should(to).equal(Math.min(3, total));
      });

      it('should raise limit to 1', async () => {
        const res = await list({ limit: 0 }).expect(206);
        should(res.body.organizations).have.length(1);
      });

      it('should cap limit at 100', async () => {
        const res = await list({ limit: 200 }).expect(206);
        should(res.body.organizations.length).be.lessThanOrEqual(100);
        const { to, total } = parseContentRange(res);
        should(to).equal(Math.min(100, total));
      });

      it('should raise a negative skip to 0', async () => {
        const [first, negative] = await Promise.all([
          list({ skip: 0, limit: 2 }).expect(206),
          list({ skip: -5, limit: 2 }).expect(206),
        ]);
        should(negative.body.organizations).eql(first.body.organizations);
      });

      it('should fall back to the defaults on non-numeric values', async () => {
        const [byDefault, garbage] = await Promise.all([
          list().expect(206),
          list({ limit: 'abc', skip: 'xyz' }).expect(206),
        ]);
        should(garbage.body.organizations).eql(byDefault.body.organizations);
      });

      it('should return 200 with an empty list beyond the last page', async () => {
        const res = await list({ skip: 100000 }).expect(200);
        should(res.body.organizations).eql([]);
      });

      it('should return 200 with an empty list beyond the last deleted page', async () => {
        const res = await list(
          { isDeleted: 'true', skip: 100000 },
          moderatorToken
        ).expect(200);
        should(res.body.organizations).eql([]);
      });
    });

    describe('validation', () => {
      it('should return 400 on an invalid isDeleted value', async () => {
        const res = await list({ isDeleted: 'maybe' }, moderatorToken).expect(
          400
        );
        should(res.body).have.property('metadata');
        should(res.body.metadata.field).equal('isDeleted');
        should(res.body.metadata.value).equal('maybe');
      });

      it('should validate isDeleted before checking the role', async () => {
        await list({ isDeleted: 'nope' }).expect(400);
      });
    });
  });
});
