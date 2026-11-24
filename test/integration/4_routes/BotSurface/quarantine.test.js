const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

const POSITION = '46°06\'08"N 6°30\'36"E';
const URL = '/api/v1/bot-surface/quarantine';

describe('GET /api/v1/bot-surface/quarantine', () => {
  let adminToken;
  let moderatorToken;
  let userToken;
  let allToken;
  const created = { description: [], name: [], cave: [] };

  const query = (sql, params) => CommonService.query(sql, params);
  const get = (token, qs = '') => {
    const req = supertest(sails.hooks.http.app).get(`${URL}${qs}`);
    return token ? req.set('Authorization', token) : req;
  };

  const mkCave = async (name) => {
    const cave = await TCave.create({ author: 1 }).fetch();
    created.cave.push(cave.id);
    const row = await TName.create({
      author: 1,
      cave: cave.id,
      name,
      language: 'eng',
      isMain: true,
    }).fetch();
    created.name.push(row.id);
    return cave;
  };
  const mkDescription = async (props) => {
    const row = await TDescription.create({
      author: 1,
      title: 'T',
      body: 'clean',
      language: 'fra',
      ...props,
    }).fetch();
    created.description.push(row.id);
    return row;
  };
  const verdict = (table, id, patternId, excerpt) =>
    query(
      `INSERT INTO t_bot_text_scan
         (source_table, source_id, body_hash, pattern_version, matched, pattern_id, match_excerpt)
       VALUES ($1, $2, 'h', 1, $3, $4, $5)
       ON CONFLICT (source_table, source_id) DO UPDATE SET matched = $3, pattern_id = $4, match_excerpt = $5`,
      [table, id, patternId !== null, patternId, excerpt]
    );

  before(async () => {
    adminToken = await AuthTokenService.getRawBearerAdminToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
    allToken = await AuthTokenService.getRawBearerAllGroupsToken();
  });

  afterEach(async () => {
    await query('TRUNCATE t_bot_text_scan');
    await query('TRUNCATE t_bot_pipeline_run');
    await TDescription.destroy({ id: created.description });
    await TName.destroy({ id: created.name });
    await TCave.destroy({ id: created.cave });
    created.description = [];
    created.name = [];
    created.cave = [];
  });

  describe('access', () => {
    it('is 401 when unauthenticated', async () => {
      await get(null).expect(401);
    });

    it('is 403 for a user who is neither moderator nor administrator, with no data in the body', async () => {
      const cave = await mkCave('Secret cave');
      const description = await mkDescription({
        cave: cave.id,
        body: POSITION,
      });
      await verdict('t_description', description.id, 'dms', '46°06\'08"N');

      const res = await get(userToken).expect(403);

      const body = JSON.stringify(res.body) + res.text;
      should(body).not.containEql('46°');
      should(body).not.containEql('Secret cave');
      should(res.body).not.have.property('items');
    });

    it('is 200 for a moderator', async () => {
      await get(moderatorToken).expect(200);
    });

    it('is 200 for an administrator who is not a moderator', async () => {
      await get(adminToken).expect(200);
    });

    it('is 200 for a user in every group', async () => {
      await get(allToken).expect(200);
    });
  });

  describe('content', () => {
    it('lists the quarantined texts with their owner and excerpt', async () => {
      const cave = await mkCave('Gouffre Test');
      const description = await mkDescription({
        cave: cave.id,
        body: POSITION,
      });
      await verdict('t_description', description.id, 'dms', '46°06\'08"N');

      const res = await get(moderatorToken).expect(200);

      should(res.body.totalCount).equal(1);
      should(res.body.items).have.length(1);
      const [item] = res.body.items;
      should(item.sourceTable).equal('t_description');
      should(item.sourceId).equal(description.id);
      should(item.entity).eql({
        type: 'cave',
        id: cave.id,
        name: 'Gouffre Test',
      });
      should(item.language).equal('fra');
      should(item.patternId).equal('dms');
      should(item.matchExcerpt).equal('46°06\'08"N');
      should(item.scannedAt).be.a.String();
    });

    it('leaves out clean and deleted texts', async () => {
      const cave = await mkCave('C');
      const clean = await mkDescription({ cave: cave.id });
      await verdict('t_description', clean.id, null, null);
      const deleted = await mkDescription({ cave: cave.id, isDeleted: true });
      await verdict('t_description', deleted.id, 'dms', 'x');

      const res = await get(moderatorToken).expect(200);

      should(res.body.totalCount).equal(0);
      should(res.body.items).eql([]);
      should(res.body.aggregates.total).equal(0);
    });

    it('leaves out texts on a deleted or merged record', async () => {
      const live = await mkCave('Live');
      const deleted = await mkCave('Deleted');
      const merged = await mkCave('Merged');
      await TCave.updateOne({ id: deleted.id }).set({ isDeleted: true });
      await TCave.updateOne({ id: merged.id }).set({
        isDeleted: true,
        redirectTo: live.id,
      });
      for (const cave of [live, deleted, merged]) {
        // eslint-disable-next-line no-await-in-loop
        const d = await mkDescription({ cave: cave.id, body: POSITION });
        // eslint-disable-next-line no-await-in-loop
        await verdict('t_description', d.id, 'dms', 'x');
      }

      const res = await get(moderatorToken).expect(200);

      should(res.body.totalCount).equal(1);
      should(res.body.items[0].entity.id).equal(live.id);
      should(res.body.aggregates.total).equal(1);
    });

    it('lists quarantined names under their record', async () => {
      const cave = await mkCave('Name with 46.10222 6.51234');
      const [nameId] = created.name;
      await verdict('t_name', nameId, 'decimal-pair', '46.10222 6.51234');

      const res = await get(moderatorToken).expect(200);

      should(res.body.items[0].sourceTable).equal('t_name');
      should(res.body.items[0].entity.type).equal('cave');
      should(res.body.items[0].entity.id).equal(cave.id);
    });
  });

  describe('filters, aggregates and paging', () => {
    let cave;
    beforeEach(async () => {
      cave = await mkCave('C');
      const massif = await TMassif.create({ author: 1 }).fetch();
      created.massifs = [...(created.massifs || []), massif.id];
      const rows = [
        [{ cave: cave.id, language: 'fra' }, 'dms'],
        [{ cave: cave.id, language: 'eng' }, 'dms'],
        [{ massif: massif.id, language: 'fra' }, 'utm'],
      ];
      for (const [props, patternId] of rows) {
        // eslint-disable-next-line no-await-in-loop
        const d = await mkDescription(props);
        // eslint-disable-next-line no-await-in-loop
        await verdict('t_description', d.id, patternId, 'x');
      }
    });
    afterEach(async () => {
      await TMassif.destroy({ id: created.massifs });
      created.massifs = [];
    });

    it('narrows by entityType, patternId and language', async () => {
      let res = await get(moderatorToken, '?entityType=massif').expect(200);
      should(res.body.totalCount).equal(1);
      res = await get(moderatorToken, '?patternId=dms').expect(200);
      should(res.body.totalCount).equal(2);
      res = await get(moderatorToken, '?language=fra').expect(200);
      should(res.body.totalCount).equal(2);
      res = await get(
        moderatorToken,
        '?patternId=dms&language=fra&entityType=cave'
      ).expect(200);
      should(res.body.totalCount).equal(1);
    });

    it('keeps the aggregates over the whole backlog, adding up to the total', async () => {
      const filtered = await get(moderatorToken, '?patternId=utm').expect(200);
      const { aggregates } = filtered.body;

      should(filtered.body.totalCount).equal(1);
      should(aggregates.total).equal(3);
      should(aggregates.byPatternId).eql({ dms: 2, utm: 1 });
      should(aggregates.byEntityType).eql({ cave: 2, massif: 1 });
      const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
      should(sum(aggregates.byPatternId)).equal(aggregates.total);
      should(sum(aggregates.byEntityType)).equal(aggregates.total);
    });

    it('pages with skip and limit, and caps an oversized limit at 100', async () => {
      let res = await get(moderatorToken, '?limit=2').expect(200);
      should(res.body.items).have.length(2);
      should(res.body.totalCount).equal(3);
      res = await get(moderatorToken, '?limit=2&skip=2').expect(200);
      should(res.body.items).have.length(1);
      res = await get(moderatorToken, '?limit=100000').expect(200);
      should(res.body.limit).equal(100);
    });

    it('is 400 on an unknown filter value', async () => {
      await get(moderatorToken, '?entityType=bogus').expect(400);
      await get(moderatorToken, '?patternId=bogus').expect(400);
      await get(moderatorToken, '?language=fr').expect(400);
    });
  });

  describe('trend', () => {
    const run = (patternVersion, total, minutesAgo) =>
      query(
        `INSERT INTO t_bot_pipeline_run (started_at, finished_at, status, counts)
         VALUES (now() - $1 * interval '1 minute', now() - $1 * interval '1 minute', 'succeeded', $2::jsonb)`,
        [
          minutesAgo,
          JSON.stringify({ scan: { patternVersion, quarantineTotal: total } }),
        ]
      );

    it('is empty when no run recorded a total', async () => {
      await query(
        `INSERT INTO t_bot_pipeline_run (status, counts) VALUES ('succeeded', '{"scan":{"quarantined":{}}}')`
      );
      const res = await get(moderatorToken).expect(200);
      should(res.body.trend.latest).be.null();
      should(res.body.trend.previous).be.null();
    });

    it('skips a run whose count failed', async () => {
      await run(1, 10, 300);
      await query(
        `INSERT INTO t_bot_pipeline_run (status, counts)
         VALUES ('succeeded', '{"scan":{"patternVersion":1,"quarantineTotal":null}}')`
      );

      const res = await get(moderatorToken).expect(200);

      should(res.body.trend.latest.total).equal(10);
      should(res.body.trend.previous).be.null();
    });

    it('returns the two latest totals with their pattern versions', async () => {
      await run(1, 10, 300);
      await run(1, 12, 200);
      await run(2, 40, 100);

      const res = await get(moderatorToken).expect(200);

      should(res.body.trend.latest.total).equal(40);
      should(res.body.trend.latest.patternVersion).equal(2);
      should(res.body.trend.previous.total).equal(12);
      should(res.body.trend.previous.patternVersion).equal(1);
      should(res.body.trend.currentPatternVersion).be.a.Number();
    });
  });
});
