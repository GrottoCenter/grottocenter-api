const fs = require('fs');
const os = require('os');
const path = require('path');
const should = require('should');
const sinon = require('sinon');

// A square no other test uses
const POLYGON = 'SRID=4326;POLYGON((170 20, 171 20, 171 21, 170 21, 170 20))';
const INSIDE = { latitude: 20.5, longitude: 170.5 };
const OUTSIDE = { latitude: -30, longitude: 100 };
const VERSION = 5;
const DAY = 24 * 3600;
const BASE_URL = 'https://grottocenter.org/ui';

describe('BotOutboxService', () => {
  let BotOutboxService;
  let BotPageGeneratorService;
  let MassifService;
  let LocalStorageAdapter;
  let root;
  let adapter;
  let originalConfig;

  const created = {
    cave: [],
    entrance: [],
    massif: [],
    organization: [],
    name: [],
    description: [],
  };
  const query = (sql, params) => CommonService.query(sql, params);

  before(async () => {
    // Sails re-requires api/ when it lifts: require the services here
    /* eslint-disable global-require */
    BotOutboxService = require('../../../api/services/bot/BotOutboxService');
    BotPageGeneratorService = require('../../../api/services/bot/BotPageGeneratorService');
    MassifService = require('../../../api/services/MassifService');
    ({ LocalStorageAdapter } = require('../../../api/services/bot/storage'));
    /* eslint-enable global-require */
    originalConfig = (await query('SELECT * FROM t_bot_config')).rows[0];
    await query('UPDATE t_bot_config SET pattern_version = $1', [VERSION]);
  });

  after(async () => {
    await query(
      'UPDATE t_bot_config SET min_age_days = $1, pattern_version = $2',
      [originalConfig.min_age_days, originalConfig.pattern_version]
    );
  });

  // histo_delete() turns the first DELETE of a live row into a soft delete: a
  // second one removes it, so that nothing is left to the suites that follow
  const purge = async (model, ids) => {
    await model.destroy({ id: ids });
    await model.destroy({ id: ids });
  };

  beforeEach(async () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'gc-bot-outbox-'));
    adapter = new LocalStorageAdapter(root);
    await query('TRUNCATE t_bot_outbox, t_bot_page_manifest');
  });

  afterEach(async () => {
    sinon.restore();
    await query(
      'TRUNCATE t_bot_admission, t_bot_text_scan, t_bot_page_manifest, t_bot_outbox, t_search_outbox'
    );
    await query(
      'UPDATE t_bot_config SET min_age_days = 30, pattern_version = $1',
      [VERSION]
    );
    await purge(TDescription, created.description);
    await purge(TName, created.name);
    await purge(TEntrance, created.entrance);
    await purge(TCave, created.cave);
    await purge(TMassif, created.massif);
    await purge(TGrotto, created.organization);
    Object.values(created).forEach((ids) => ids.splice(0));
    fs.rmSync(root, { recursive: true, force: true });
  });

  // ---- fixtures -----------------------------------------------------------

  const setDates = async (table, id, days) => {
    const {
      rows: [{ t }],
    } = await query('SELECT LOCALTIMESTAMP - make_interval(secs => $1) AS t', [
      days * DAY,
    ]);
    await query(
      `UPDATE ${table} SET date_inscription = $2, date_reviewed = $2 WHERE id = $1`,
      [id, t]
    );
  };

  const admit = (type, id) =>
    query(
      `INSERT INTO t_bot_admission (entity_type, entity_id, bot_admitted_at)
       VALUES ($1, $2, now() - make_interval(secs => $3)) ON CONFLICT DO NOTHING`,
      [type, id, 60 * DAY]
    );

  const scan = (table, id) => {
    const hash =
      table === 't_name'
        ? "md5(COALESCE(t.name, ''))"
        : "md5(COALESCE(t.title, '') || E'\\n' || COALESCE(t.body, ''))";
    return query(
      `INSERT INTO t_bot_text_scan (source_table, source_id, body_hash, pattern_version, matched)
       SELECT $1, t.id, ${hash}, $3, false FROM ${table} t WHERE t.id = $2`,
      [table, id, VERSION]
    );
  };

  const mkName = async (owner, name) => {
    const row = await TName.create({
      author: 1,
      name,
      language: 'fra',
      isMain: true,
      ...owner,
    }).fetch();
    created.name.push(row.id);
    await setDates('t_name', row.id, 100);
    await scan('t_name', row.id);
    return row;
  };

  const mkDescription = async (owner, body) => {
    const row = await TDescription.create({
      author: 1,
      title: 'Title',
      body,
      language: 'fra',
      ...owner,
    }).fetch();
    created.description.push(row.id);
    await setDates('t_description', row.id, 60);
    await scan('t_description', row.id);
    return row;
  };

  // A cave with a page: admitted, named
  const mkCave = async (name, { admitted = true } = {}) => {
    const cave = await TCave.create({ author: 1, depth: 120 }).fetch();
    created.cave.push(cave.id);
    await setDates('t_cave', cave.id, 60);
    await mkName({ cave: cave.id }, name);
    if (admitted) await admit('cave', cave.id);
    return cave;
  };

  const mkEntrance = async (
    caveId,
    name,
    { place = OUTSIDE, isSensitive = false, isLocked = false } = {}
  ) => {
    const entrance = await TEntrance.create({
      author: 1,
      cave: caveId,
      country: 'FR',
      iso_3166_2: 'FR-01',
      isSensitive,
      isSensitiveLocked: isLocked,
      ...place,
    }).fetch();
    created.entrance.push(entrance.id);
    await setDates('t_entrance', entrance.id, 60);
    await mkName({ entrance: entrance.id }, name);
    await admit('entrance', entrance.id);
    return entrance;
  };

  // A cave with a page and one public entrance
  const mkPublishedCave = async (
    name,
    entranceName = `Entrance of ${name}`
  ) => {
    const cave = await mkCave(name);
    const entrance = await mkEntrance(cave.id, entranceName);
    return { cave, entrance };
  };

  const mkMassif = async (name, { admitted = true } = {}) => {
    const massif = await TMassif.create({
      author: 1,
      geogPolygon: POLYGON,
      isSensitive: false,
    }).fetch();
    created.massif.push(massif.id);
    await setDates('t_massif', massif.id, 60);
    await mkName({ massif: massif.id }, name);
    if (admitted) await admit('massif', massif.id);
    return massif;
  };

  // A cave with a public entrance inside the polygon, so that massifs have pages
  const mkListedCave = async (name) => {
    const cave = await mkCave(name);
    const entrance = await mkEntrance(cave.id, `Entrance of ${name}`, {
      place: INSIDE,
    });
    return { cave, entrance };
  };

  const mkOrganization = async (name, { admitted = true } = {}) => {
    const organization = await TGrotto.create({ author: 1 }).fetch();
    created.organization.push(organization.id);
    await setDates('t_grotto', organization.id, 60);
    await mkName({ grotto: organization.id }, name);
    if (admitted) await admit('organization', organization.id);
    return organization;
  };

  // ---- the system under test ---------------------------------------------

  // The nightly run: what is online before the change
  const generate = async (target = adapter) => {
    await BotPageGeneratorService.run({ adapter: target });
    await query('TRUNCATE t_bot_outbox');
  };

  const work = (options = {}) => BotOutboxService.run({ adapter, ...options });

  const keyOf = (type, id) => `${type}s/${id}.html`;
  const isOnline = (key) => fs.existsSync(path.join(root, key));
  const html = (key, dir = root) =>
    fs.readFileSync(path.join(dir, key), 'utf8');
  const manifestRow = async (key) =>
    (await query('SELECT * FROM t_bot_page_manifest WHERE path = $1', [key]))
      .rows[0];
  const outboxCount = async () =>
    (await query('SELECT count(*)::int AS n FROM t_bot_outbox')).rows[0].n;

  // Page gone from the adapter AND the manifest
  const shouldBeWithdrawn = async (type, id) => {
    should(isOnline(keyOf(type, id))).be.false();
    should(await manifestRow(keyOf(type, id))).be.undefined();
  };

  // ---- withdrawals --------------------------------------------------------

  describe('a change that removes data from a page', () => {
    it('re-renders the cave page without an entrance marked sensitive', async () => {
      const { cave, entrance: kept } = await mkPublishedCave(
        'Gouffre Withdrawal',
        'Public Doorway'
      );
      const secret = await mkEntrance(cave.id, 'Secret Doorway');
      await generate();
      should(html(keyOf('cave', cave.id))).containEql('Secret Doorway');
      const before = (await manifestRow(keyOf('cave', cave.id))).content_hash;

      await query('UPDATE t_entrance SET is_sensitive = true WHERE id = $1', [
        secret.id,
      ]);
      const result = await work();

      const page = html(keyOf('cave', cave.id));
      should(page).not.containEql('Secret Doorway');
      should(page).containEql('Public Doorway');
      should(kept.id).not.equal(secret.id);
      should(
        (await manifestRow(keyOf('cave', cave.id))).content_hash
      ).not.equal(before);
      should(result).containEql({ skipped: false, rows: 1, uploaded: 1 });
      should(await outboxCount()).equal(0);
    });

    it('deletes the cave page when its last public entrance turns sensitive', async () => {
      const { cave, entrance } = await mkPublishedCave('Gouffre Last');
      await generate();
      should(isOnline(keyOf('cave', cave.id))).be.true();

      await query('UPDATE t_entrance SET is_sensitive = true WHERE id = $1', [
        entrance.id,
      ]);
      const result = await work();

      await shouldBeWithdrawn('cave', cave.id);
      should(result.deleted).equal(1);
      should(await outboxCount()).equal(0);
    });

    it('deletes the massif page and re-renders its caves when the massif turns sensitive', async () => {
      const massif = await mkMassif('Massif Secret');
      const cave = await mkCave('Gouffre Two Doors');
      await mkEntrance(cave.id, 'Door Outside');
      await mkEntrance(cave.id, 'Door Inside', { place: INSIDE });
      await generate();
      should(html(keyOf('cave', cave.id))).containEql('Massif Secret');
      should(html(keyOf('cave', cave.id))).containEql('Door Inside');
      should(isOnline(keyOf('massif', massif.id))).be.true();

      // Marks the massif and cascades to the entrances inside it
      await MassifService.setSensitivity(massif.id, true, 1);
      await work();

      await shouldBeWithdrawn('massif', massif.id);
      const page = html(keyOf('cave', cave.id));
      should(page).not.containEql('Massif Secret');
      should(page).not.containEql('Door Inside');
      should(page).containEql('Door Outside');
      should(await outboxCount()).equal(0);
    });

    it('deletes the pages of a cave that becomes sensitive with its massif', async () => {
      const massif = await mkMassif('Massif Whole');
      const { cave } = await mkListedCave('Gouffre Inside');
      await generate();

      await MassifService.setSensitivity(massif.id, true, 1);
      await work();

      await shouldBeWithdrawn('massif', massif.id);
      await shouldBeWithdrawn('cave', cave.id);
    });

    it('takes a cave off the massif page when its entrance inside the massif turns sensitive', async () => {
      const massif = await mkMassif('Massif Shrinking');
      const { entrance: leaving } = await mkListedCave('Gouffre Leaving');
      await mkListedCave('Gouffre Remaining');
      await generate();
      should(html(keyOf('massif', massif.id))).containEql('Gouffre Leaving');

      await query('UPDATE t_entrance SET is_sensitive = true WHERE id = $1', [
        leaving.id,
      ]);
      await work();

      const page = html(keyOf('massif', massif.id));
      should(page).not.containEql('Gouffre Leaving');
      should(page).containEql('Gouffre Remaining');
    });

    it('takes a massif off the cave page of a locked public entrance when the massif turns sensitive', async () => {
      const massif = await mkMassif('Massif Locked');
      const cave = await mkCave('Gouffre Locked Door');
      await mkEntrance(cave.id, 'Locked Public Door', {
        place: INSIDE,
        isLocked: true,
      });
      await generate();
      should(html(keyOf('cave', cave.id))).containEql('Massif Locked');

      // A locked entrance is left as it is by the cascade: only the massif changes
      await MassifService.setSensitivity(massif.id, true, 1);
      await work();

      await shouldBeWithdrawn('massif', massif.id);
      const page = html(keyOf('cave', cave.id));
      should(page).not.containEql('Massif Locked');
      should(page).containEql('Locked Public Door');
    });

    it('deletes the page of a deleted cave and takes it off the massif page', async () => {
      const massif = await mkMassif('Massif Listing');
      const { cave } = await mkListedCave('Gouffre Deleted');
      await mkListedCave('Gouffre Stays');
      await generate();
      should(html(keyOf('massif', massif.id))).containEql('Gouffre Deleted');

      await TCave.destroy({ id: cave.id });
      await work();

      await shouldBeWithdrawn('cave', cave.id);
      const page = html(keyOf('massif', massif.id));
      should(page).not.containEql('Gouffre Deleted');
      should(page).containEql('Gouffre Stays');
    });

    it('deletes the page of a deleted massif', async () => {
      const massif = await mkMassif('Massif Deleted');
      const { cave } = await mkListedCave('Gouffre In Deleted');
      await generate();
      should(html(keyOf('cave', cave.id))).containEql('Massif Deleted');

      await TMassif.destroy({ id: massif.id });
      await work();

      await shouldBeWithdrawn('massif', massif.id);
      should(html(keyOf('cave', cave.id))).not.containEql('Massif Deleted');
    });

    it('deletes the page of a deleted organization', async () => {
      const organization = await mkOrganization('Club Deleted');
      const other = await mkOrganization('Club Stays');
      await generate();
      should(isOnline(keyOf('organization', organization.id))).be.true();

      await TGrotto.destroy({ id: organization.id });
      await work();

      await shouldBeWithdrawn('organization', organization.id);
      should(isOnline(keyOf('organization', other.id))).be.true();
    });

    it('takes an edited description off the page until it is scanned again', async () => {
      const { cave } = await mkPublishedCave('Gouffre Words');
      const description = await mkDescription(
        { cave: cave.id },
        'Original words of the description'
      );
      await generate();
      should(html(keyOf('cave', cave.id))).containEql('Original words');

      await query('UPDATE t_description SET body = $2 WHERE id = $1', [
        description.id,
        'Edited words, not scanned yet',
      ]);
      await work();

      const page = html(keyOf('cave', cave.id));
      should(page).not.containEql('Original words');
      should(page).not.containEql('Edited words');
    });

    it('takes a renamed cave off its page until the new name is scanned', async () => {
      const { cave } = await mkPublishedCave('Gouffre Old Name');
      await generate();

      await query('UPDATE t_name SET name = $2 WHERE id_cave = $1', [
        cave.id,
        'Gouffre New Name',
      ]);
      await work();

      // No scanned main name, no page
      await shouldBeWithdrawn('cave', cave.id);
    });

    it('leaves a page alone when nothing it shows changed', async () => {
      const { cave } = await mkPublishedCave('Gouffre Quiet');
      await generate();
      const before = await manifestRow(keyOf('cave', cave.id));

      await query('UPDATE t_entrance SET city = $2 WHERE id_cave = $1', [
        cave.id,
        'Somewhere',
      ]);
      const result = await work();

      // The city is on the page, so it changes; a column it does not show does not
      await query(
        "UPDATE t_entrance SET contact = 'someone' WHERE id_cave = $1",
        [cave.id]
      );
      const second = await work();
      should(result.rows).equal(1);
      should(second.uploaded).equal(0);
      should(second.unchanged).be.above(0);
      should(
        (await manifestRow(keyOf('cave', cave.id))).content_hash
      ).not.equal(before.content_hash);
    });
  });

  // ---- merges -------------------------------------------------------------

  describe('a record that is merged', () => {
    const merge = (table, id, targetId) =>
      query(
        `UPDATE ${table} SET is_deleted = true, redirect_to = $2 WHERE id = $1`,
        [id, targetId]
      );

    const redirectsTo = async (type, id, targetId) => {
      const row = await manifestRow(keyOf(type, id));
      should(row.redirect_to).equal(targetId);
      const sidecar = JSON.parse(
        fs.readFileSync(path.join(root, `${keyOf(type, id)}.metadata.json`))
      );
      should(sidecar.redirectto).equal(`${BASE_URL}/${type}s/${targetId}`);
      should(html(keyOf(type, id))).containEql('noindex');
    };

    it('replaces a cave page with a redirect page when the target is published', async () => {
      const { cave: source } = await mkPublishedCave('Gouffre Source');
      const { cave: target } = await mkPublishedCave('Gouffre Target');
      await generate();

      await merge('t_cave', source.id, target.id);
      const result = await work();

      await redirectsTo('cave', source.id, target.id);
      should(isOnline(keyOf('cave', target.id))).be.true();
      should(result.redirected).equal(1);
      should(result.deleted).equal(0);
    });

    it('replaces a massif page with a redirect page when the target is published', async () => {
      const source = await mkMassif('Massif Source');
      const target = await mkMassif('Massif Target');
      await mkListedCave('Gouffre Shared');
      await generate();

      await merge('t_massif', source.id, target.id);
      await work();

      await redirectsTo('massif', source.id, target.id);
    });

    it('replaces an organization page with a redirect page when the target is published', async () => {
      const source = await mkOrganization('Club Source');
      const target = await mkOrganization('Club Target');
      await generate();

      await merge('t_grotto', source.id, target.id);
      await work();

      await redirectsTo('organization', source.id, target.id);
    });

    it('deletes the page when the target is not published', async () => {
      const { cave: source } = await mkPublishedCave('Gouffre Lonely');
      const target = await mkCave('Gouffre Unpublished', { admitted: false });
      await generate();

      await merge('t_cave', source.id, target.id);
      await work();

      await shouldBeWithdrawn('cave', source.id);
    });

    it('points an older redirect at the final target when its target is merged in turn', async () => {
      const { cave: first, entrance: firstDoor } =
        await mkPublishedCave('Gouffre First');
      const { cave: second, entrance: secondDoor } =
        await mkPublishedCave('Gouffre Second');
      const { cave: third } = await mkPublishedCave('Gouffre Third');
      await generate();
      // A merge moves the entrances to the target: the merged cave has none left
      await query('UPDATE t_entrance SET id_cave = $2 WHERE id = $1', [
        firstDoor.id,
        second.id,
      ]);
      await merge('t_cave', first.id, second.id);
      await work();
      await redirectsTo('cave', first.id, second.id);

      await query('UPDATE t_entrance SET id_cave = $2 WHERE id = ANY($1)', [
        [firstDoor.id, secondDoor.id],
        third.id,
      ]);
      await merge('t_cave', second.id, third.id);
      await work();

      await redirectsTo('cave', second.id, third.id);
      await redirectsTo('cave', first.id, third.id);
    });

    it('points an older organization redirect at the final target when its target is merged in turn', async () => {
      const first = await mkOrganization('Club First');
      const second = await mkOrganization('Club Second');
      const third = await mkOrganization('Club Third');
      await generate();
      await merge('t_grotto', first.id, second.id);
      await work();
      await redirectsTo('organization', first.id, second.id);

      await merge('t_grotto', second.id, third.id);
      await work();

      await redirectsTo('organization', second.id, third.id);
      await redirectsTo('organization', first.id, third.id);
    });

    it('turns a redirect page back into the page when the record is restored', async () => {
      const { cave: source } = await mkPublishedCave('Gouffre Restored');
      const { cave: target } = await mkPublishedCave('Gouffre Elsewhere');
      await generate();
      await merge('t_cave', source.id, target.id);
      await work();

      await query(
        'UPDATE t_cave SET is_deleted = false, redirect_to = NULL WHERE id = $1',
        [source.id]
      );
      await work();

      const row = await manifestRow(keyOf('cave', source.id));
      should(row.redirect_to).be.null();
      should(html(keyOf('cave', source.id))).containEql('Gouffre Restored');
    });
  });

  // ---- failure, lock, bounds ---------------------------------------------

  describe('a run', () => {
    it('leaves the outbox rows in place when the adapter fails, and finishes on the next run', async () => {
      const { cave, entrance } = await mkPublishedCave('Gouffre Failing');
      await generate();
      await query('UPDATE t_entrance SET is_sensitive = true WHERE id = $1', [
        entrance.id,
      ]);
      const rows = await outboxCount();
      should(rows).be.above(0);
      const stub = sinon
        .stub(LocalStorageAdapter.prototype, 'delete')
        .rejects(new Error('storage down'));

      await work().should.be.rejectedWith('storage down');

      should(stub.callCount).be.above(0);
      should(await outboxCount()).equal(rows);
      should(isOnline(keyOf('cave', cave.id))).be.true();

      stub.restore();
      await work();
      await shouldBeWithdrawn('cave', cave.id);
      should(await outboxCount()).equal(0);
    });

    it('skips the minute, reading nothing, while a generation run holds the lock', async () => {
      const { cave, entrance } = await mkPublishedCave('Gouffre Locked');
      await generate();
      await query('UPDATE t_entrance SET is_sensitive = true WHERE id = $1', [
        entrance.id,
      ]);
      const rows = await outboxCount();

      const during = await BotPageGeneratorService.withRunLock(() => work());

      should(during).containEql({ skipped: true, rows: 0, pages: 0 });
      should(await outboxCount()).equal(rows);
      should(isOnline(keyOf('cave', cave.id))).be.true();
      // The lock is free again: the next run does the work
      should((await work()).skipped).be.false();
      await shouldBeWithdrawn('cave', cave.id);
    });

    it('holds the generator lock while it works', async () => {
      const { entrance } = await mkPublishedCave('Gouffre Holding');
      await generate();
      await query('UPDATE t_entrance SET is_sensitive = true WHERE id = $1', [
        entrance.id,
      ]);
      let generation;
      const original = adapter.delete.bind(adapter);
      sinon.stub(adapter, 'delete').callsFake(async (key) => {
        generation = await BotPageGeneratorService.run({
          adapter: new LocalStorageAdapter(root),
        }).then(
          () => 'ran',
          (err) => err.code
        );
        return original(key);
      });

      await work();

      should(generation).equal('E_BOT_PAGES_RUNNING');
    });

    it('stops after the first batch once the time budget is spent', async () => {
      await query(
        `INSERT INTO t_bot_outbox (kind, id_entity, operation)
         SELECT 'cave', 9000000 + n, 'U' FROM generate_series(1, 5) n`
      );

      const result = await work({ batchSize: 2, timeBudgetMs: -1 });

      should(result.rows).equal(2);
      should(await outboxCount()).equal(3);
      const rest = await work({ batchSize: 2 });
      should(rest.rows).equal(3);
      should(await outboxCount()).equal(0);
    });

    it('keeps the rows when the job is aborted', async () => {
      const { cave, entrance } = await mkPublishedCave('Gouffre Aborted');
      await generate();
      await query('UPDATE t_entrance SET is_sensitive = true WHERE id = $1', [
        entrance.id,
      ]);
      const rows = await outboxCount();
      const controller = new AbortController();
      controller.abort();

      await work({ signal: controller.signal }).should.be.rejected();

      should(await outboxCount()).equal(rows);
      // Nothing was started once the job was aborted
      should(isOnline(keyOf('cave', cave.id))).be.true();
    });

    it('trims the rows older than the retention before it reads', async () => {
      await query(
        `INSERT INTO t_bot_outbox (kind, id_entity, operation, date_inscription)
         VALUES ('cave', 9000001, 'U', now() - interval '15 days'),
                ('cave', 9000002, 'U', now() - interval '13 days')`
      );

      const result = await work();

      should(result.rows).equal(1);
      should(await outboxCount()).equal(0);
    });

    it('reports what is waiting', async () => {
      should(await BotOutboxService.backlog()).eql({
        pending: 0,
        oldestSeconds: 0,
      });
      await query(
        `INSERT INTO t_bot_outbox (kind, id_entity, operation, date_inscription)
         VALUES ('cave', 9000001, 'U', now() - interval '90 seconds')`
      );
      const { pending, oldestSeconds } = await BotOutboxService.backlog();
      should(pending).equal(1);
      should(oldestSeconds).be.within(89, 95);
    });
  });

  // ---- what it leaves to the nightly run ---------------------------------

  describe('the hubs', () => {
    it('never rewrites or deletes a hub page, even when its last cave is withdrawn', async () => {
      const { cave, entrance } = await mkPublishedCave('Gouffre Hubbed');
      await generate();
      const hubKey = 'countries/FR.html';
      should(isOnline(hubKey)).be.true();
      const hub = await manifestRow(hubKey);
      should(html(hubKey)).containEql('Gouffre Hubbed');

      await query('UPDATE t_entrance SET is_sensitive = true WHERE id = $1', [
        entrance.id,
      ]);
      await work();

      await shouldBeWithdrawn('cave', cave.id);
      should(isOnline(hubKey)).be.true();
      should((await manifestRow(hubKey)).content_hash).equal(hub.content_hash);
      // The hub lists the cave until the next night, but its page is gone
      should(html(hubKey)).containEql('Gouffre Hubbed');
    });

    it('does not read v_bot_hub', async () => {
      const { entrance } = await mkPublishedCave('Gouffre No Hub Read');
      await generate();
      await query('UPDATE t_entrance SET is_sensitive = true WHERE id = $1', [
        entrance.id,
      ]);
      const spy = sinon.spy(CommonService, 'query');

      await work();

      const sqlRead = spy.getCalls().map((call) => String(call.args[0]));
      should(sqlRead.some((sql) => /v_bot_hub/.test(sql))).be.false();
    });
  });

  // ---- the same bytes as the nightly run ---------------------------------

  describe('the pages it writes', () => {
    it('are byte for byte those of the generator, breadcrumb links to a published hub included', async () => {
      const massif = await mkMassif('Massif Bytes');
      const { cave } = await mkListedCave('Gouffre Bytes');
      await mkEntrance(cave.id, 'Second Door');
      const other = await mkOrganization('Club Bytes');
      await generate();
      const generatorRoot = root;
      should(html(keyOf('cave', cave.id), generatorRoot)).containEql(
        `${BASE_URL}/countries/FR`
      );
      should(html(keyOf('massif', massif.id), generatorRoot)).containEql(
        `${BASE_URL}/countries/FR/regions/01`
      );

      // The worker rewrites the same pages into an empty site, with the hubs
      // of the manifest
      root = fs.mkdtempSync(path.join(os.tmpdir(), 'gc-bot-outbox-b-'));
      adapter = new LocalStorageAdapter(root);
      await query("DELETE FROM t_bot_page_manifest WHERE entity_type <> 'hub'");
      await query(
        `INSERT INTO t_bot_outbox (kind, id_entity, operation)
         VALUES ('cave', $1, 'U'), ('massif', $2, 'U'), ('organization', $3, 'U')`,
        [cave.id, massif.id, other.id]
      );
      const result = await work();

      should(result.uploaded).equal(3);
      ['cave', 'massif', 'organization'].forEach((type) => {
        const { id } = { cave, massif, organization: other }[type];
        should(html(keyOf(type, id))).equal(
          html(keyOf(type, id), generatorRoot)
        );
      });
      fs.rmSync(generatorRoot, { recursive: true, force: true });
    });

    it('leave the hub links out when the nightly run published no hub', async () => {
      const { cave } = await mkPublishedCave('Gouffre Unlinked');
      await generate();
      await query("DELETE FROM t_bot_page_manifest WHERE entity_type = 'hub'");
      await query('UPDATE t_cave SET depth = 999 WHERE id = $1', [cave.id]);

      await work();

      should(html(keyOf('cave', cave.id))).not.containEql(
        `${BASE_URL}/countries/FR`
      );
    });
  });

  // ---- the triggers -------------------------------------------------------

  describe('the triggers', () => {
    const rowsOf = async (table) =>
      (
        await query(
          `SELECT kind, id_entity AS "entityId", operation, old_values AS "oldValues"
           FROM ${table} ORDER BY id`
        )
      ).rows;

    it('fill t_search_outbox with the rows they always did, and t_bot_outbox with those that concern a page', async () => {
      const { cave, entrance } = await mkPublishedCave('Gouffre Triggers');
      await query('TRUNCATE t_bot_outbox, t_search_outbox');

      await query("UPDATE t_entrance SET city = 'Town' WHERE id = $1", [
        entrance.id,
      ]);
      const name = await TName.create({
        author: 1,
        cave: cave.id,
        name: 'Second name',
        language: 'fra',
        isMain: false,
      }).fetch();
      created.name.push(name.id);
      await query("UPDATE t_caver SET nickname = 'Renamed' WHERE id = 5");
      await query("UPDATE t_caver SET nickname = 'Author1' WHERE id = 5");
      await query(
        'INSERT INTO j_document_massif (id_document, id_massif) VALUES (5, 2)'
      );
      await query(
        'DELETE FROM j_document_massif WHERE id_document = 5 AND id_massif = 2'
      );
      const description = await TDescription.create({
        author: 1,
        title: 'Title',
        body: 'Body',
        language: 'fra',
        entrance: entrance.id,
      }).fetch();
      created.description.push(description.id);

      // Exactly the rows of the search outbox before this change
      should(await rowsOf('t_search_outbox')).eql([
        {
          kind: 'entrance',
          entityId: entrance.id,
          operation: 'U',
          oldValues: {},
        },
        {
          kind: 'cave_name',
          entityId: cave.id,
          operation: 'I',
          oldValues: null,
        },
        {
          kind: 'caver',
          entityId: 5,
          operation: 'U',
          oldValues: { nickname: 'Author1' },
        },
        {
          kind: 'caver',
          entityId: 5,
          operation: 'U',
          oldValues: { nickname: 'Renamed' },
        },
        { kind: 'documents', entityId: 5, operation: 'I', oldValues: null },
        { kind: 'documents', entityId: 5, operation: 'D', oldValues: null },
      ]);
      // The bot outbox: the same rows, minus the ones no page shows, plus the description
      should(await rowsOf('t_bot_outbox')).eql([
        {
          kind: 'entrance',
          entityId: entrance.id,
          operation: 'U',
          oldValues: {},
        },
        {
          kind: 'cave_name',
          entityId: cave.id,
          operation: 'I',
          oldValues: null,
        },
        {
          kind: 'entrance_description',
          entityId: entrance.id,
          operation: 'I',
          oldValues: null,
        },
      ]);
    });

    it('enqueue an update that changes nothing in neither outbox', async () => {
      const { entrance } = await mkPublishedCave('Gouffre Still');
      await query('TRUNCATE t_bot_outbox, t_search_outbox');

      await query('UPDATE t_entrance SET city = city WHERE id = $1', [
        entrance.id,
      ]);

      should(await rowsOf('t_search_outbox')).eql([]);
      should(await rowsOf('t_bot_outbox')).eql([]);
    });

    it('record a sensitivity change, which no fan-out column carries', async () => {
      const { entrance } = await mkPublishedCave('Gouffre Flag');
      await query('TRUNCATE t_bot_outbox');

      await query('UPDATE t_entrance SET is_sensitive = true WHERE id = $1', [
        entrance.id,
      ]);

      should(await rowsOf('t_bot_outbox')).eql([
        {
          kind: 'entrance',
          entityId: entrance.id,
          operation: 'U',
          oldValues: {},
        },
      ]);
    });

    it('trim: bot_outbox_trim() deletes only the rows older than 14 days', async () => {
      await query(
        `INSERT INTO t_bot_outbox (kind, id_entity, operation, date_inscription)
         VALUES ('cave', 1, 'U', now() - interval '15 days'),
                ('cave', 2, 'U', now() - interval '13 days')`
      );

      const {
        rows: [{ trimmed }],
      } = await query('SELECT bot_outbox_trim() AS trimmed');

      should(trimmed).equal(1);
      should((await rowsOf('t_bot_outbox')).map((r) => r.entityId)).eql([2]);
    });
  });

  describe('pagesOf', () => {
    it('follows the old cave of an entrance that moved, and the massifs of both', async () => {
      const massif = await mkMassif('Massif Moving');
      const { cave: from, entrance } = await mkListedCave('Gouffre From');
      const to = await mkCave('Gouffre To');
      await mkEntrance(to.id, 'Entrance To');

      const pages = await BotOutboxService.pagesOf([
        {
          kind: 'entrance',
          entityId: entrance.id,
          operation: 'U',
          oldValues: { id_cave: to.id },
        },
      ]);

      should(pages.cave).eql([from.id, to.id].sort((a, b) => a - b));
      should(pages.massif).eql([massif.id]);
      should(pages.organization).eql([]);
    });
  });
});
