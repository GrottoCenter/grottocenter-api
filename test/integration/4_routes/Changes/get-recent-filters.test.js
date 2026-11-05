const supertest = require('supertest');
const should = require('should');
const CommonService = require('../../../../api/services/CommonService');
const RecentChangeService = require('../../../../api/services/RecentChangeService');

// Authors of the logged changes: MEMBER belongs to the test organization,
// OTHER does not. Neither is the author of the rows the triggers log while the
// entities are created, so those rows never mix with the ones under test.
const MEMBER_ID = 6;
const OTHER_ID = 7;
const FLOOD_AUTHOR_ID = 8;

// A square no other test uses
const POLYGON =
  'SRID=4326;POLYGON((160 -40, 161 -40, 161 -39, 160 -39, 160 -40))';
const INSIDE = { latitude: -39.5, longitude: 160.5 };
const OUTSIDE = { latitude: -30, longitude: 100 };

const getRecent = (query) =>
  supertest(sails.hooks.http.app)
    .get('/api/v1/changes/recent')
    .query({ limit: 1000, ...query })
    .set('Accept', 'application/json');

describe('Changes - GET /api/v1/changes/recent filters', () => {
  const ids = {};
  const lastChangeIds = [];

  // Logs a change `minutesAgo` minutes before a point one day ahead. Dating
  // the changes in the future keeps them among the RECENT_CHANGES_LIMIT newest
  // raw changes, whatever the tests that ran before logged. They are spread out
  // so that neither the cave/entrance deduplication nor the grouping merges them
  const logChange = async (
    minutesAgo,
    { type, change = 'update', id, relatedType = null, relatedId = null },
    author = OTHER_ID
  ) => {
    const { rows } = await CommonService.query(
      `INSERT INTO t_last_change
        (type_entity, type_change, date_change, id_entity, id_author, type_related_entity, id_related_entity, name)
       VALUES ($1, $2, now() + interval '1 day' - make_interval(mins => $3), $4, $5, $6, $7, 'filter test')
       RETURNING id`,
      [type, change, minutesAgo, id, author, relatedType, relatedId]
    );
    lastChangeIds.push(rows[0].id);
  };

  const createEntrance = (caveId, props) =>
    TEntrance.create({
      author: 1,
      cave: caveId,
      isSensitive: false,
      ...props,
    }).fetch();

  const createDocument = (data = {}) =>
    TDocument.create({
      author: 1,
      type: 1,
      license: 1,
      isValidated: true,
      dateValidation: new Date(),
      ...data,
    }).fetch();

  // Groups of a response about one entity, by one author
  const groupsOf = (body, entityType, entityId, authorId = OTHER_ID) =>
    body.changes.filter(
      (c) =>
        c.mainEntityType === entityType &&
        c.mainEntityId === entityId &&
        c.authorId === authorId
    );

  const shouldContain = (body, entityType, entityId, authorId) =>
    should(groupsOf(body, entityType, entityId, authorId)).have.length(
      1,
      `expected one ${entityType} ${entityId} change by ${authorId}`
    );

  const shouldNotContain = (body, entityType, entityId, authorId) =>
    should(groupsOf(body, entityType, entityId, authorId)).have.length(
      0,
      `expected no ${entityType} ${entityId} change by ${authorId}`
    );

  before(async () => {
    ids.massif = (
      await TMassif.create({ author: 1, geogPolygon: POLYGON }).fetch()
    ).id;

    // Network A: A1 in France, inside the massif; A2 in Spain, outside it.
    // Both are in region FR-01, so a change to the cave matches it twice.
    ids.caveA = (await TCave.create({ author: 1 }).fetch()).id;
    ids.entranceA1 = (
      await createEntrance(ids.caveA, {
        ...INSIDE,
        country: 'FR',
        iso_3166_2: 'FR-01',
      })
    ).id;
    ids.entranceA2 = (
      await createEntrance(ids.caveA, {
        ...OUTSIDE,
        country: 'ES',
        iso_3166_2: 'FR-01',
      })
    ).id;
    // Cave B: one entrance in Spain
    ids.caveB = (await TCave.create({ author: 1 }).fetch()).id;
    ids.entranceB = (
      await createEntrance(ids.caveB, { ...OUTSIDE, country: 'ES' })
    ).id;

    ids.documentEntrance = (await createDocument()).id;
    await CommonService.query(
      'INSERT INTO j_document_entrance (id_document, id_entrance) VALUES ($1, $2)',
      [ids.documentEntrance, ids.entranceA1]
    );
    ids.documentCave = (await createDocument({ cave: ids.caveB })).id;
    ids.documentMassif = (await createDocument({ massif: ids.massif })).id;
    ids.documentCountry = (await createDocument()).id;
    await CommonService.query(
      'INSERT INTO j_document_country (id_document, id_country) VALUES ($1, $2)',
      [ids.documentCountry, 'ES']
    );
    ids.documentRegion = (await createDocument()).id;
    await CommonService.query(
      'INSERT INTO j_document_iso3166_2 (id_document, id_iso) VALUES ($1, $2)',
      [ids.documentRegion, 'FR-01']
    );

    ids.organization = (await TGrotto.create({ author: 1 }).fetch()).id;
    await CommonService.query(
      'INSERT INTO j_grotto_caver (id_caver, id_grotto) VALUES ($1, $2)',
      [MEMBER_ID, ids.organization]
    );
    ids.spanishOrganization = (
      await TGrotto.create({ author: 1, country: 'ES' }).fetch()
    ).id;

    await logChange(10, { type: 'entrance', id: ids.entranceA1 }, MEMBER_ID);
    await logChange(20, {
      type: 'comment',
      change: 'create',
      id: 900001,
      relatedType: 'entrance',
      relatedId: ids.entranceA2,
    });
    await logChange(30, { type: 'cave', change: 'delete', id: ids.caveA });
    await logChange(40, {
      type: 'description',
      id: 900002,
      relatedType: 'cave',
      relatedId: ids.caveB,
    });
    await logChange(50, { type: 'document', id: ids.documentEntrance });
    await logChange(
      60,
      { type: 'document', id: ids.documentMassif },
      MEMBER_ID
    );
    await logChange(70, { type: 'document', id: ids.documentCountry });
    await logChange(80, { type: 'document', id: ids.documentRegion });
    await logChange(90, { type: 'massif', id: ids.massif });
    await logChange(100, {
      type: 'description',
      id: 900003,
      relatedType: 'massif',
      relatedId: ids.massif,
    });
    await logChange(110, { type: 'grotto', id: ids.spanishOrganization });
    await logChange(120, { type: 'document', id: ids.documentCave });
  });

  after(async () => {
    await CommonService.query('DELETE FROM t_last_change WHERE id = ANY($1)', [
      lastChangeIds,
    ]);
    await CommonService.query(
      'DELETE FROM j_grotto_caver WHERE id_grotto = $1',
      [ids.organization]
    );
  });

  it('keeps unfiltered requests unchanged', async () => {
    const { body } = await getRecent({}).expect(200);
    should(Object.keys(body)).eql(['changes']);
    shouldContain(body, 'entrance', ids.entranceA1, MEMBER_ID);
    shouldContain(body, 'massif', ids.massif);
    shouldContain(body, 'grotto', ids.spanishOrganization);
  });

  it('filters by country through entrances, networks, sub-entities, documents and organizations', async () => {
    const { body: fr } = await getRecent({ countryId: 'fr' }).expect(200);
    shouldContain(fr, 'entrance', ids.entranceA1, MEMBER_ID);
    shouldContain(fr, 'cave', ids.caveA);
    shouldContain(fr, 'document', ids.documentEntrance);
    shouldContain(fr, 'document', ids.documentRegion); // FR-01 is in France
    shouldNotContain(fr, 'entrance', ids.entranceA2);
    shouldNotContain(fr, 'cave', ids.caveB);
    shouldNotContain(fr, 'document', ids.documentCountry);
    shouldNotContain(fr, 'document', ids.documentMassif, MEMBER_ID);
    shouldNotContain(fr, 'massif', ids.massif);
    shouldNotContain(fr, 'grotto', ids.spanishOrganization);

    const { body: es } = await getRecent({ countryId: 'ES' }).expect(200);
    shouldContain(es, 'entrance', ids.entranceA2); // comment on A2
    shouldContain(es, 'cave', ids.caveA); // network A has an entrance in Spain
    shouldContain(es, 'cave', ids.caveB); // description of cave B
    shouldContain(es, 'document', ids.documentCountry);
    shouldContain(es, 'document', ids.documentCave);
    shouldContain(es, 'grotto', ids.spanishOrganization);
    shouldNotContain(es, 'entrance', ids.entranceA1, MEMBER_ID);
    shouldNotContain(es, 'document', ids.documentEntrance);
    shouldNotContain(es, 'document', ids.documentRegion);
  });

  it('filters by region, returning a change once when several relationships match', async () => {
    const { body } = await getRecent({ regionId: 'FR-01' }).expect(200);
    // Both entrances of network A are in FR-01; a deletion is never grouped,
    // so a duplicated raw change would show up as two groups
    shouldContain(body, 'cave', ids.caveA);
    shouldContain(body, 'entrance', ids.entranceA1, MEMBER_ID);
    shouldContain(body, 'entrance', ids.entranceA2);
    shouldContain(body, 'document', ids.documentEntrance);
    shouldContain(body, 'document', ids.documentRegion);
    shouldNotContain(body, 'cave', ids.caveB);
    shouldNotContain(body, 'document', ids.documentCountry);
  });

  it('filters by massif, including the massif itself and its descriptions', async () => {
    const { body } = await getRecent({ massifId: ids.massif }).expect(200);
    shouldContain(body, 'entrance', ids.entranceA1, MEMBER_ID);
    shouldContain(body, 'cave', ids.caveA);
    shouldContain(body, 'document', ids.documentEntrance);
    shouldContain(body, 'document', ids.documentMassif, MEMBER_ID);
    const massifGroups = groupsOf(body, 'massif', ids.massif);
    should(massifGroups).have.length(1);
    should(massifGroups[0].mainAction).equal('update');
    should(massifGroups[0].subEntityTypes).eql(['description']);
    shouldNotContain(body, 'entrance', ids.entranceA2);
    shouldNotContain(body, 'cave', ids.caveB);
    shouldNotContain(body, 'document', ids.documentRegion);
  });

  it("filters by the author's current membership of an organization", async () => {
    const { body } = await getRecent({
      organizationId: ids.organization,
    }).expect(200);
    should(body.changes.map((c) => c.authorId)).matchEach(MEMBER_ID);
    shouldContain(body, 'entrance', ids.entranceA1, MEMBER_ID);
    shouldContain(body, 'document', ids.documentMassif, MEMBER_ID);
  });

  it('combines filters with AND', async () => {
    const { body } = await getRecent({
      organizationId: ids.organization,
      massifId: ids.massif,
      countryId: 'FR',
    }).expect(200);
    shouldContain(body, 'entrance', ids.entranceA1, MEMBER_ID);
    // In the massif, but not in France
    shouldNotContain(body, 'document', ids.documentMassif, MEMBER_ID);
    // In the massif and in France, but not by a member
    shouldNotContain(body, 'cave', ids.caveA);

    const { body: none } = await getRecent({
      countryId: 'FR',
      regionId: 'FR-01',
      organizationId: ids.organization,
      offset: 0,
      limit: 10,
    }).expect(200);
    should(none.changes.every((c) => c.authorId === MEMBER_ID)).be.true();
  });

  it('paginates the filtered, grouped results', async () => {
    const { body: all } = await getRecent({ massifId: ids.massif }).expect(200);
    should(all.changes.length).be.greaterThanOrEqual(5);
    const { body: page } = await getRecent({
      massifId: ids.massif,
      offset: 1,
      limit: 2,
    }).expect(200);
    should(page.changes).eql(all.changes.slice(1, 3));
  });

  it('returns the existing shape when nothing matches', async () => {
    const { body } = await getRecent({ countryId: 'FR' })
      .query({ offset: 10000 })
      .expect(200);
    should(body).eql({ changes: [] });
  });

  describe('more raw changes than the global cap', () => {
    before(async () => {
      // Newer changes about organizations no filter matches, enough to push
      // every change logged above out of the unfiltered selection
      const { rows } = await CommonService.query(
        `INSERT INTO t_last_change (type_entity, type_change, date_change, id_entity, id_author, name)
         SELECT 'grotto', 'update', now() + interval '2 days', 800000 + n, $1, 'flood'
         FROM generate_series(1, $2::int) AS n
         RETURNING id`,
        [FLOOD_AUTHOR_ID, RecentChangeService.RECENT_CHANGES_LIMIT]
      );
      lastChangeIds.push(...rows.map((r) => r.id));
    });

    it('still returns the matching changes of a quieter area', async () => {
      const { body: unfiltered } = await getRecent({}).expect(200);
      shouldNotContain(unfiltered, 'grotto', ids.spanishOrganization);

      const { body } = await getRecent({ countryId: 'ES' }).expect(200);
      shouldContain(body, 'grotto', ids.spanishOrganization);
      shouldContain(body, 'cave', ids.caveB);
    });
  });

  describe('validation', () => {
    [
      { countryId: 'FRA' },
      { countryId: '' },
      { regionId: 'ARA' },
      { massifId: 'abc' },
      { massifId: '0' },
      { organizationId: '-3' },
    ].forEach((query) => {
      it(`answers 400 to ${JSON.stringify(query)}`, async () => {
        const [[field, value]] = Object.entries(query);
        const { body } = await getRecent(query).expect(400);
        should(body).match({
          code: 'E_BAD_REQUEST',
          metadata: { field, value },
        });
      });
    });

    [
      { countryId: 'ZZ' },
      { regionId: 'FR-ZZZ' },
      { massifId: 999999 },
      { organizationId: 999999 },
    ].forEach((query) => {
      it(`answers 404 to ${JSON.stringify(query)}`, async () => {
        const { body } = await getRecent(query).expect(404);
        should(body.message).endWith('not found.');
      });
    });
  });
});
