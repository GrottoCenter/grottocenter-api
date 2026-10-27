const should = require('should');
const sinon = require('sinon');

// A square no other test uses, so these rows cannot satisfy or break another
// suite's assertions.
const POLYGON =
  'SRID=4326;POLYGON((150 -40, 151 -40, 151 -39, 150 -39, 150 -40))';

describe('bot_cascade_check - massif-to-entrance sensitivity invariant', () => {
  const massifIds = [];
  const entranceIds = [];
  const caveIds = [];
  let originalBoss;
  let startedAt;

  const check = async () => {
    const { rows } = await CommonService.query(
      'SELECT * FROM bot_cascade_check()'
    );
    return rows[0];
  };

  const createMassif = async (isSensitive) => {
    const massif = await TMassif.create({
      isSensitive,
      author: 1,
      geogPolygon: POLYGON,
    }).fetch();
    massifIds.push(massif.id);
    return massif;
  };

  const createEntrance = async (props) => {
    const cave = await TCave.create({ author: 1 }).fetch();
    caveIds.push(cave.id);
    const entrance = await TEntrance.create({
      author: 1,
      cave: cave.id,
      latitude: -39.5,
      longitude: 150.5,
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

  before(() => {
    startedAt = new Date();
    originalBoss = sails.enrichmentBoss;
    sails.enrichmentBoss = { send: sinon.stub().resolves() };
  });

  after(() => {
    sails.enrichmentBoss = originalBoss;
  });

  afterEach(async () => {
    if (entranceIds.length) {
      await TName.destroy({ entrance: entranceIds });
      await TEntrance.destroy({ id: entranceIds });
    }
    if (caveIds.length) {
      await TName.destroy({ cave: caveIds });
      await TCave.destroy({ id: caveIds });
    }
    // The CSV import also records recent changes for the rows it creates
    if (entranceIds.length || caveIds.length) {
      await TLastChange.destroy({
        entityId: [...entranceIds, ...caveIds],
        dateChange: { '>=': startedAt },
      });
    }
    if (massifIds.length) await TMassif.destroy({ id: massifIds });
    entranceIds.length = 0;
    caveIds.length = 0;
    massifIds.length = 0;
  });

  // The test database has no trigger filling point_geom, so no fixture entrance
  // joins a massif: this proves the function runs and returns empty lists.
  it('runs on the baseline fixtures and returns empty lists', async () => {
    const result = await check();
    should(Number(result.violation_count)).equal(0);
    should(result.violation_ids).deepEqual([]);
    should(Number(result.override_count)).equal(0);
    should(result.override_ids).deepEqual([]);
  });

  it('reports an unlocked non-sensitive entrance inside a sensitive massif as a violation, with its id', async () => {
    await createMassif(true);
    const entrance = await createEntrance({});

    const result = await check();
    should(Number(result.violation_count)).equal(1);
    should(result.violation_ids).deepEqual([entrance.id]);
    should(Number(result.override_count)).equal(0);
  });

  it('reports a locked non-sensitive entrance as an override, not a violation', async () => {
    await createMassif(true);
    const entrance = await createEntrance({ isSensitiveLocked: true });

    const result = await check();
    should(Number(result.violation_count)).equal(0);
    should(Number(result.override_count)).equal(1);
    should(result.override_ids).deepEqual([entrance.id]);
  });

  it('ignores an entrance that is already sensitive', async () => {
    await createMassif(true);
    await createEntrance({ isSensitive: true });

    const result = await check();
    should(Number(result.violation_count)).equal(0);
    should(Number(result.override_count)).equal(0);
  });

  it('ignores an entrance inside a non-sensitive massif', async () => {
    await createMassif(false);
    await createEntrance({});

    const result = await check();
    should(Number(result.violation_count)).equal(0);
    should(Number(result.override_count)).equal(0);
  });

  it('ignores an entrance outside every sensitive massif', async () => {
    await createMassif(true);
    await createEntrance({ latitude: -30, longitude: 100 });

    should(Number((await check()).violation_count)).equal(0);
  });

  it('ignores a deleted entrance and an entrance of a deleted massif', async () => {
    const massif = await createMassif(true);
    await createEntrance({ isDeleted: true });
    await TMassif.update({ id: massif.id }).set({ isDeleted: true });
    await createEntrance({ latitude: -39.2 });

    const result = await check();
    should(Number(result.violation_count)).equal(0);
    should(Number(result.override_count)).equal(0);
  });

  it('counts an entrance once when two sensitive massifs contain it', async () => {
    await createMassif(true);
    await createMassif(true);
    const entrance = await createEntrance({});

    const result = await check();
    should(Number(result.violation_count)).equal(1);
    should(result.violation_ids).deepEqual([entrance.id]);
  });

  it('caps each id list at 100 and keeps the exact count', async () => {
    await createMassif(true);
    const cave = await TCave.create({ author: 1 }).fetch();
    caveIds.push(cave.id);
    const { rows } = await CommonService.query(
      `INSERT INTO t_entrance (id_author, id_cave, latitude, longitude, point_geom, is_sensitive, is_sensitive_locked, is_deleted, date_inscription)
       SELECT 1, $1, -39.5, 150.5, ST_SetSRID(ST_MakePoint(150.5, -39.5), 4326), false, false, false, now()
       FROM generate_series(1, 105)
       RETURNING id`,
      [cave.id]
    );
    rows.forEach((r) => entranceIds.push(r.id));

    const result = await check();
    should(Number(result.violation_count)).equal(105);
    should(result.violation_ids).have.length(100);
    should(result.violation_ids).deepEqual(
      rows
        .map((r) => r.id)
        .sort((a, b) => a - b)
        .slice(0, 100)
    );
  });

  describe('the code the guard watches', () => {
    it('leaves no violation after MassifService.setSensitivity(true), and keeps a locked entrance as an override', async () => {
      const massif = await createMassif(false);
      const unlocked = await createEntrance({});
      const locked = await createEntrance({
        isSensitiveLocked: true,
        latitude: -39.4,
      });
      should(Number((await check()).violation_count)).equal(0);

      await sails.services.massifservice.setSensitivity(massif.id, true, 1);

      const result = await check();
      should(Number(result.violation_count)).equal(0);
      should(result.override_ids).deepEqual([locked.id]);
      should((await TEntrance.findOne(unlocked.id)).isSensitive).be.true();
    });

    it('leaves no violation for an entrance created by the CSV import inside a sensitive massif', async () => {
      await createMassif(true);

      const result = await CSVImportQueueService.processOneChunk({
        data: {
          batchId: 'test-batch-bot-cascade',
          chunkIndex: 0,
          rows: [
            {
              originalLine: 2,
              row: {
                id: '77771',
                'rdf:type': 'Entrance',
                'dct:rights/cc:attributionName': 'BotCascade Author',
                'dct:rights/karstlink:licenseType': 'CC-BY-SA',
                'gn:countryCode': 'AU',
                'w3geo:latitude': '-39.5',
                'w3geo:longitude': '150.5',
                'rdfs:label/dc:language': 'eng',
                'rdfs:label': 'Bot Cascade Import Entrance',
              },
            },
          ],
          tokenMeta: { id: 1, groups: ['admin'] },
        },
      });
      should(result.successes).have.length(1);
      const { entranceId, caveId } = result.successes[0];
      entranceIds.push(entranceId);
      caveIds.push(caveId);
      await CommonService.query(
        'UPDATE t_entrance SET point_geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) WHERE id = $1',
        [entranceId]
      );

      should((await TEntrance.findOne(entranceId)).isSensitive).be.true();
      should(Number((await check()).violation_count)).equal(0);
    });
  });
});
