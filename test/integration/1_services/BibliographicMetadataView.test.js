const fs = require('fs');
const path = require('path');
const should = require('should');

// Builds the SELECT of the latest v_bibliographic_metadata migration over real
// t_document rows, in a scratch view: the test database does not run the
// migrations, so the VBibliographicMetadata fixtures never exercise this SQL.
const MIGRATION = path.join(
  __dirname,
  '../../../sql/9_47_2026_11_27_bibliographic_metadata_hide_deleted.sql'
);
const SCRATCH = 'v_bibliographic_metadata_sql_test';

const extractSelect = () => {
  const sql = fs.readFileSync(MIGRATION, 'utf8');
  const start = sql.indexOf('CREATE MATERIALIZED VIEW');
  const as = sql.indexOf(' AS\n', start) + 4;
  const end = sql.indexOf('WITH DATA;', as);
  return sql.slice(as, end);
};

describe('v_bibliographic_metadata SQL (#2056)', () => {
  const ids = {};
  let rows;

  const create = async (key, attributes) => {
    const doc = await TDocument.create({
      author: 1,
      license: 1,
      type: 18,
      isValidated: true,
      dateInscription: '2026-01-01T00:00:00.000Z',
      dateValidation: '2026-01-02T00:00:00.000Z',
      ...attributes,
    }).fetch();
    ids[key] = doc.id;
    await TDescription.create({
      document: doc.id,
      title: `title ${key}`,
      body: `body ${key}`,
      language: 'eng',
      author: 1,
    });
    return doc;
  };

  before(async () => {
    await create('live', {});
    await create('deleted', {
      isDeleted: true,
      dateReviewed: '2026-03-04T00:00:00.000Z',
    });
    await create('merged', {
      redirectTo: null,
      dateReviewed: '2026-03-05T00:00:00.000Z',
    });
    await TDocument.updateOne({ id: ids.merged }).set({ redirectTo: ids.live });
    await create('pending', { isValidated: false, dateValidation: null });
    await create('refused', { isValidated: false });
    await create('neverValidatedDeleted', {
      isDeleted: true,
      isValidated: false,
      dateValidation: null,
    });
    await create('childLive', { parent: ids.live });
    await create('childDeleted', { parent: ids.live, isDeleted: true });
    await create('childPending', { parent: ids.live, isValidated: false });

    await sails.sendNativeQuery(`DROP MATERIALIZED VIEW IF EXISTS ${SCRATCH}`);
    await sails.sendNativeQuery(
      `CREATE MATERIALIZED VIEW ${SCRATCH} AS ${extractSelect()} WITH DATA`
    );
    const result = await sails.sendNativeQuery(
      `SELECT * FROM ${SCRATCH} WHERE id_document = ANY($1)`,
      [Object.values(ids)]
    );
    rows = {};
    Object.entries(ids).forEach(([key, id]) => {
      rows[key] = result.rows.find((r) => r.id_document === id);
    });
  });

  after(async () => {
    await sails.sendNativeQuery(`DROP MATERIALIZED VIEW IF EXISTS ${SCRATCH}`);
    await TDescription.destroy({ document: Object.values(ids) });
    await TDocument.destroy({ id: Object.values(ids) });
  });

  it('exports a validated document in full, as registered', () => {
    rows.live.metadata_status.should.equal('registered');
    rows.live.dc_title.should.equal('title live');
    rows.live.dc_descriptions.should.deepEqual(['body live']);
  });

  it('exports a deleted document as a content-free tombstone', () => {
    const row = rows.deleted;
    row.metadata_status.should.equal('deleted');
    row.oai_identifier.should.equal(`oai:grottocenter.org:${ids.deleted}`);
    should(row.dc_title).be.null();
    row.dc_descriptions.should.deepEqual([]);
    row.dc_creators.should.deepEqual([]);
    row.dc_formats.should.deepEqual([]);
    row.dc_identifiers.should.deepEqual([]);
    row.children.should.deepEqual([]);
    row.parents.should.deepEqual([]);
    row.list_sets.should.containEql('grottocenter');
  });

  it('exports a merged document as a tombstone', () => {
    rows.merged.metadata_status.should.equal('deleted');
    should(rows.merged.dc_title).be.null();
  });

  it('dates a tombstone by its review, so harvesters see the deletion', () => {
    new Date(rows.deleted.last_update)
      .toISOString()
      .should.equal('2026-03-04T00:00:00.000Z');
  });

  it('leaves out pending and refused documents', () => {
    should(rows.pending).be.undefined();
    should(rows.refused).be.undefined();
  });

  it('leaves out a deleted document that was never validated', () => {
    should(rows.neverValidatedDeleted).be.undefined();
  });

  it('lists only live documents as children', () => {
    rows.live.children.map((c) => c.id).should.deepEqual([ids.childLive]);
  });

  it('lists a live document as the parent of a live child', () => {
    rows.childLive.parents.map((p) => p.id).should.deepEqual([ids.live]);
  });
});
