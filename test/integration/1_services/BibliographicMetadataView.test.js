const fs = require('fs');
const path = require('path');
const should = require('should');
const {
  ATTACH_DOCUMENT_HISTO_TRIGGER,
  DETACH_DOCUMENT_HISTO_TRIGGER,
} = require('../../customSQL');

// Builds the SELECT of the latest v_bibliographic_metadata migration over real
// t_document rows, in a scratch view: the test database does not run the
// migrations, so the VBibliographicMetadata fixtures never exercise this SQL.
// The latest migration is the highest-numbered sql/9_*.sql that builds
// v_bibliographic_metadata_new.
const SQL_DIR = path.join(__dirname, '../../../sql');
const sequence = (file) => parseInt(file.split('_')[1], 10);
const MIGRATION = path.join(
  SQL_DIR,
  fs
    .readdirSync(SQL_DIR)
    .filter(
      (file) =>
        /^9_\d+_.*\.sql$/.test(file) &&
        fs
          .readFileSync(path.join(SQL_DIR, file), 'utf8')
          .includes('CREATE MATERIALIZED VIEW v_bibliographic_metadata_new')
    )
    .sort((a, b) => sequence(a) - sequence(b))
    .pop()
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
  const fileIds = [];
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
    await create('grandchild', { parent: ids.childDeleted });
    await create('childOfDeleted', { parent: ids.childDeleted });
    await create('childOfPending', { parent: ids.pending });
    await create('modificationPending', {
      isValidated: false,
      dateValidation: null,
      modifiedDocJson: { wasValidated: true },
    });
    await create('modificationPendingDeleted', {
      isValidated: false,
      dateValidation: null,
      isDeleted: true,
      dateReviewed: '2026-03-06T00:00:00.000Z',
      modifiedDocJson: { wasValidated: true },
    });
    await create('submissionWithModification', {
      isValidated: false,
      dateValidation: null,
      modifiedDocJson: { wasValidated: false },
    });
    // Documents validated, then edited: the history trigger copies the
    // validated row into h_document, as in production (DocumentService
    // .updateDocument).
    await create('editedFlag', { dateReviewed: '2026-01-03T00:00:00.000Z' });
    await create('editedLegacy', { dateReviewed: '2026-01-03T00:00:00.000Z' });
    await create('submissionLegacy', {
      isValidated: false,
      dateValidation: null,
      dateReviewed: '2026-01-03T00:00:00.000Z',
    });
    await sails.sendNativeQuery(ATTACH_DOCUMENT_HISTO_TRIGGER);
    try {
      const pending = (modifiedDocJson) => ({
        isValidated: false,
        dateValidation: null,
        dateReviewed: '2026-02-01T00:00:00.000Z',
        modifiedDocJson,
      });
      await TDocument.updateOne({ id: ids.editedFlag }).set(
        pending({ wasValidated: true })
      );
      await TDocument.updateOne({ id: ids.editedLegacy }).set(pending({}));
      await TDocument.updateOne({ id: ids.submissionLegacy }).set(pending({}));
    } finally {
      await sails.sendNativeQuery(DETACH_DOCUMENT_HISTO_TRIGGER);
    }
    await create('withFiles', {});
    const createFile = (filePath, isValidated) =>
      TFile.create({
        dateInscription: new Date(),
        fileName: filePath,
        path: filePath,
        fileFormat: 1,
        document: ids.withFiles,
        isValidated,
      }).fetch();
    fileIds.push(
      (await createFile('validated-blob.pdf', true)).id,
      (await createFile('pending-blob.pdf', false)).id
    );

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
    await TFile.destroy({ id: fileIds });
    await TDescription.destroy({ document: Object.values(ids) });
    await sails.sendNativeQuery('DELETE FROM h_document WHERE id = ANY($1)', [
      Object.values(ids),
    ]);
    await TDocument.destroy({ id: Object.values(ids) });
  });

  it('no longer exports has_been_updated (#2056)', () => {
    rows.live.should.not.have.property('has_been_updated');
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

  it('does not export the path of a file waiting for moderation (#2057)', () => {
    rows.withFiles.dc_formats.should.deepEqual(['validated-blob.pdf']);
    rows.withFiles.dc_identifiers.should.deepEqual(['validated-blob.pdf']);
  });

  it('lists only live documents as children', () => {
    rows.live.children.map((c) => c.id).should.deepEqual([ids.childLive]);
  });

  it('stops the hierarchy at a hidden document', () => {
    rows.live.children.map((c) => c.id).should.not.containEql(ids.grandchild);
    rows.grandchild.parents.should.deepEqual([]);
  });

  it('points dc_relations only to a parent that is exported', () => {
    rows.childOfDeleted.dc_relations.should.deepEqual([
      `oai:grottocenter.org:${ids.childDeleted}`,
    ]);
    rows.childOfPending.dc_relations.should.deepEqual([]);
    rows.childLive.dc_relations.should.deepEqual([
      `oai:grottocenter.org:${ids.live}`,
    ]);
  });

  it('keeps an accepted document registered while a modification is pending', () => {
    rows.modificationPending.metadata_status.should.equal('registered');
    rows.modificationPending.dc_title.should.equal('title modificationPending');
    // No validated history row: the last_update fallback chain must hold.
    should(rows.modificationPending.last_update).not.be.null();
  });

  it('dates a document with a pending modification by its last validation', () => {
    [rows.editedFlag, rows.editedLegacy].forEach((row) => {
      row.metadata_status.should.equal('registered');
      new Date(row.last_update)
        .toISOString()
        .should.equal('2026-01-02T00:00:00.000Z');
    });
  });

  it('reads the history for a modification stored without the wasValidated flag', () => {
    rows.editedLegacy.metadata_status.should.equal('registered');
    should(rows.submissionLegacy).be.undefined();
  });

  it('gives a tombstone to an accepted document deleted with a pending modification', () => {
    rows.modificationPendingDeleted.metadata_status.should.equal('deleted');
    should(rows.modificationPendingDeleted.dc_title).be.null();
  });

  it('leaves out a never accepted submission with a pending modification', () => {
    should(rows.submissionWithModification).be.undefined();
  });

  it('lists a live document as the parent of a live child', () => {
    rows.childLive.parents.map((p) => p.id).should.deepEqual([ids.live]);
  });
});
