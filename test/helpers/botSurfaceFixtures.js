/**
 * Builds the records the bot pages are made of (caves with entrances, massifs,
 * organizations, their names and descriptions), for the tests that run the
 * generator, the sitemaps, the withdrawal worker or the nightly pipeline over
 * real rows. Models and CommonService are Sails globals, so call
 * createBotFixtures() inside a test hook, not at load time.
 *
 * Everything created is tracked: cleanup() destroys it (twice, because
 * histo_delete() makes the first DELETE of a live row a soft delete, and a
 * soft-deleted row would stay behind for the suites that follow) and empties
 * the bot tables.
 */

const DAY = 24 * 3600;
// A square no other suite uses
const POLYGON = 'SRID=4326;POLYGON((160 30, 161 30, 161 31, 160 31, 160 30))';
const INSIDE = { latitude: 30.5, longitude: 160.5 };
const OUTSIDE = { latitude: -30, longitude: 100 };

const BOT_TABLES = [
  't_bot_admission',
  't_bot_text_scan',
  't_bot_page_manifest',
  't_bot_outbox',
  't_bot_pipeline_run',
].join(', ');

const createBotFixtures = ({ scanVersion }) => {
  const created = {
    cave: [],
    entrance: [],
    massif: [],
    organization: [],
    name: [],
    description: [],
  };
  const query = (sql, params) => CommonService.query(sql, params);

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

  // A clean verdict at scanVersion, with the hash the admission function checks
  const scan = (table, id) => {
    const hash =
      table === 't_name'
        ? "md5(COALESCE(t.name, ''))"
        : "md5(COALESCE(t.title, '') || E'\\n' || COALESCE(t.body, ''))";
    return query(
      `INSERT INTO t_bot_text_scan (source_table, source_id, body_hash, pattern_version, matched)
       SELECT $1, t.id, ${hash}, $3, false FROM ${table} t WHERE t.id = $2`,
      [table, id, scanVersion]
    );
  };

  const mkName = async (
    owner,
    name,
    { scanned = true, ageDays = 100 } = {}
  ) => {
    const row = await TName.create({
      author: 1,
      name,
      language: 'fra',
      isMain: true,
      ...owner,
    }).fetch();
    created.name.push(row.id);
    await setDates('t_name', row.id, ageDays);
    if (scanned) await scan('t_name', row.id);
    return row;
  };

  const mkDescription = async (
    owner,
    body,
    { scanned = true, ageDays = 60 } = {}
  ) => {
    const row = await TDescription.create({
      author: 1,
      title: 'Title',
      body,
      language: 'fra',
      ...owner,
    }).fetch();
    created.description.push(row.id);
    await setDates('t_description', row.id, ageDays);
    if (scanned) await scan('t_description', row.id);
    return row;
  };

  // `admitted: false` leaves admission to the pipeline; `ageDays` is the age of
  // the record, which admission judges against the minimum age
  const mkCave = async (
    name,
    { admitted = true, ageDays = 60, depth = 120, scanned = true } = {}
  ) => {
    const cave = await TCave.create({ author: 1, depth }).fetch();
    created.cave.push(cave.id);
    await setDates('t_cave', cave.id, ageDays);
    await mkName({ cave: cave.id }, name, { scanned });
    if (admitted) await admit('cave', cave.id);
    return cave;
  };

  const mkEntrance = async (
    caveId,
    name,
    { place = OUTSIDE, admitted = true, ageDays = 60, scanned = true } = {}
  ) => {
    const entrance = await TEntrance.create({
      author: 1,
      cave: caveId,
      country: 'FR',
      iso_3166_2: 'FR-01',
      isSensitive: false,
      isSensitiveLocked: false,
      ...place,
    }).fetch();
    created.entrance.push(entrance.id);
    await setDates('t_entrance', entrance.id, ageDays);
    // The test database has no trigger filling point_geom
    await query(
      'UPDATE t_entrance SET point_geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) WHERE id = $1',
      [entrance.id]
    );
    await mkName({ entrance: entrance.id }, name, { scanned });
    if (admitted) await admit('entrance', entrance.id);
    return entrance;
  };

  const mkMassif = async (
    name,
    { admitted = true, ageDays = 60, scanned = true } = {}
  ) => {
    const massif = await TMassif.create({
      author: 1,
      geogPolygon: POLYGON,
      isSensitive: false,
    }).fetch();
    created.massif.push(massif.id);
    await setDates('t_massif', massif.id, ageDays);
    await mkName({ massif: massif.id }, name, { scanned });
    if (admitted) await admit('massif', massif.id);
    return massif;
  };

  const mkOrganization = async (
    name,
    { admitted = true, ageDays = 60, scanned = true } = {}
  ) => {
    const organization = await TGrotto.create({ author: 1 }).fetch();
    created.organization.push(organization.id);
    await setDates('t_grotto', organization.id, ageDays);
    await mkName({ grotto: organization.id }, name, { scanned });
    if (admitted) await admit('organization', organization.id);
    return organization;
  };

  // The first DELETE of a live row is a soft delete (histo_delete): destroy twice
  const purge = async (model, ids) => {
    await model.destroy({ id: ids });
    await model.destroy({ id: ids });
  };

  const cleanup = async () => {
    await query(`TRUNCATE ${BOT_TABLES}, t_search_outbox`);
    // The audit may have stopped publishing: back to the state of a fresh database
    await query(
      `INSERT INTO t_bot_surface_state (id, publishing, reason, updated_at)
       VALUES (1, true, NULL, now())
       ON CONFLICT (id) DO UPDATE SET publishing = true, reason = NULL, updated_at = now()`
    );
    await purge(TDescription, created.description);
    await purge(TName, created.name);
    await purge(TEntrance, created.entrance);
    await purge(TCave, created.cave);
    await purge(TMassif, created.massif);
    await purge(TGrotto, created.organization);
    Object.values(created).forEach((ids) => ids.splice(0));
  };

  return {
    created,
    query,
    setDates,
    mkName,
    mkDescription,
    mkCave,
    mkEntrance,
    mkMassif,
    mkOrganization,
    cleanup,
    POLYGON,
    INSIDE,
    OUTSIDE,
  };
};

module.exports = { createBotFixtures };
