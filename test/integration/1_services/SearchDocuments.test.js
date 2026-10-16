const should = require('should');
// Required at load time, together: dbSync is not a Sails service, and the
// copies Sails re-requires when it lifts are not the ones it holds
const CommonService = require('../../../api/services/CommonService');
const syncUtils = require('../../../api/dbSync/utils');
const {
  getEntity,
  normalizeIds,
  buildDocuments,
  planSync,
} = require('../../../api/dbSync/searchDocuments');

const COLLECTIONS = [
  'organizations',
  'persons',
  'massifs',
  'entrances',
  'caves',
  'documents',
  'devices',
];

// What the full rebuild builds for a collection
const rebuild = async (collectionName) => {
  const entity = getEntity(collectionName);
  const documents = [];
  const pages = syncUtils.paggingQuery(entity.name, entity.query);
  for await (const row of entity.processRows(pages)) documents.push(row);
  return documents;
};

describe('searchDocuments', () => {
  describe('normalizeIds()', () => {
    it('keeps each positive integer once, numeric strings included', () => {
      should(normalizeIds([3, '3', '12', 1, 3])).eql([3, 12, 1]);
    });

    it('drops what is not a positive integer id', () => {
      should(normalizeIds([0, -1, 1.5, 'abc', null, undefined, 4])).eql([4]);
    });

    it('returns no id for a missing list', () => {
      should(normalizeIds(undefined)).eql([]);
      should(normalizeIds(null)).eql([]);
    });
  });

  describe('getEntity()', () => {
    it('finds the entity of every search collection', () => {
      for (const collectionName of COLLECTIONS) {
        should(getEntity(collectionName).search.schema.name).equal(
          collectionName
        );
      }
    });

    it('throws on an unknown collection', () => {
      should(() => getEntity('unknown')).throw(
        'Unknown search collection unknown'
      );
    });
  });

  describe('buildDocuments()', () => {
    // Same ids as the rebuild, so both run the same joins on the same rows
    for (const collectionName of COLLECTIONS) {
      it(`builds the same ${collectionName} documents as the full rebuild`, async () => {
        const expected = await rebuild(collectionName);
        should(expected).not.be.empty();

        const documents = await buildDocuments(
          collectionName,
          expected.map((d) => d.id)
        );

        should(documents).eql(expected);
      });
    }

    it('builds only the requested ids', async () => {
      const documents = await buildDocuments('entrances', [7, 2]);
      should(documents.map((d) => d.id)).eql([2, 7]);
    });

    it('accepts string and duplicated ids', async () => {
      const documents = await buildDocuments('caves', ['1', 1, '2']);
      should(documents.map((d) => d.id)).eql([1, 2]);
    });

    it('hides the coordinates of a sensitive entrance', async () => {
      // Entrance 6 is the sensitive fixture
      const [sensitive] = await buildDocuments('entrances', [6]);
      should(sensitive.isSensitive).be.true();
      should(sensitive.latitude).be.null();
      should(sensitive.longitude).be.null();

      const [visible] = await buildDocuments('entrances', [1]);
      should(visible.isSensitive).be.false();
      should(visible.latitude).be.a.Number();
      should(visible.longitude).be.a.Number();
    });

    it('leaves out a soft-deleted device', async () => {
      // Device 2 is the soft-deleted fixture
      const documents = await buildDocuments('devices', [1, 2, 3]);
      should(documents.map((d) => d.id)).eql([1, 3]);
    });

    it('leaves out the ids that do not exist', async () => {
      const documents = await buildDocuments('entrances', [424242, 1]);
      should(documents.map((d) => d.id)).eql([1]);
    });

    it('returns no document without ids', async () => {
      should(await buildDocuments('entrances', [])).eql([]);
      should(await buildDocuments('entrances', ['abc'])).eql([]);
    });

    it('throws on an unknown collection', async () => {
      await buildDocuments('unknown', [1]).should.be.rejectedWith(
        'Unknown search collection unknown'
      );
    });
  });

  describe('built fields', () => {
    it('names an entrance after its main name, not its first name', async () => {
      // Entrance 2 also has a non-main French name that sorts first
      const [doc] = await buildDocuments('entrances', [2]);
      should(doc.name).equal('The entrance with name 12');
      should(doc.language).equal('eng');
    });

    describe('document linked to an entrance', () => {
      before(async () => {
        await CommonService.query(
          'INSERT INTO j_document_entrance (id_document, id_entrance) VALUES (4, 2)'
        );
        await CommonService.query(
          "INSERT INTO j_document_language (id_document, id_language, is_main) VALUES (4, 'fra', true)"
        );
      });

      after(async () => {
        await CommonService.query(
          'DELETE FROM j_document_entrance WHERE id_document = 4 AND id_entrance = 2'
        );
        await CommonService.query(
          "DELETE FROM j_document_language WHERE id_document = 4 AND id_language = 'fra'"
        );
      });

      it('embeds the entrance with its main name', async () => {
        const [doc] = await buildDocuments('documents', [4]);
        should(doc.entrances).eql([
          { id: 2, name: 'The entrance with name 12', language: 'eng' },
        ]);
      });

      it('keeps the publication date', async () => {
        const [doc] = await buildDocuments('documents', [4]);
        should(doc.datePublication).equal('2010-02');
      });

      it('indexes the document language', async () => {
        const [doc] = await buildDocuments('documents', [4]);
        const formatted = getEntity('documents').search.importFormater(doc);
        should(formatted.language).equal('fra');
      });
    });
  });

  // A cave created through its entrance has no name row of its own and goes by
  // the entrance's main name (NameService.setNames)
  describe('cave named after its entrance', () => {
    let cave;
    let deletedEntrance;
    let entrance;

    before(async () => {
      cave = await TCave.create({ author: 1, depth: 100 }).fetch();
      // Created first, so it has the lower id
      deletedEntrance = await TEntrance.create({
        author: 1,
        cave: cave.id,
        latitude: 45.1,
        longitude: 6.1,
        isDeleted: true,
      }).fetch();
      await TName.create({
        author: 1,
        entrance: deletedEntrance.id,
        name: 'Filled-in Entrance',
        language: 'fra',
        isMain: true,
      });
      entrance = await TEntrance.create({
        author: 1,
        cave: cave.id,
        latitude: 45.0,
        longitude: 6.0,
      }).fetch();
      await TName.create({
        author: 1,
        entrance: entrance.id,
        name: 'Unnamed Cave Entrance',
        language: 'eng',
        isMain: true,
      });
      await CommonService.query(
        'UPDATE t_document SET id_cave = $1 WHERE id = 4',
        [cave.id]
      );
    });

    after(async () => {
      await CommonService.query(
        'UPDATE t_document SET id_cave = NULL WHERE id = 4'
      );
      await TName.destroy({ entrance: [entrance.id, deletedEntrance.id] });
      await TEntrance.destroy({ id: [entrance.id, deletedEntrance.id] });
      await TCave.destroyOne({ id: cave.id });
    });

    // The live entrance is used over the soft-deleted one, whose id is lower
    it('indexes the cave under the entrance name', async () => {
      const [doc] = await buildDocuments('caves', [cave.id]);
      should(doc.name).equal('Unnamed Cave Entrance');
      should(doc.language).equal('eng');
    });

    it('embeds the entrance name as the cave of the entrance', async () => {
      const [doc] = await buildDocuments('entrances', [entrance.id]);
      should(doc.cave.name).equal('Unnamed Cave Entrance');
    });

    it('embeds the entrance name as the cave of a document', async () => {
      const [doc] = await buildDocuments('documents', [4]);
      should(doc.cave).eql({ name: 'Unnamed Cave Entrance', language: 'eng' });
    });

    it('falls back on a soft-deleted entrance when no live one has a name', async () => {
      await TName.update({ entrance: entrance.id }).set({ isDeleted: true });
      try {
        const [doc] = await buildDocuments('caves', [cave.id]);
        should(doc.name).equal('Filled-in Entrance');
        should(doc.language).equal('fra');
      } finally {
        await TName.update({ entrance: entrance.id }).set({ isDeleted: false });
      }
    });

    it('prefers the cave main name once the cave has one', async () => {
      const name = await TName.create({
        author: 1,
        cave: cave.id,
        name: 'Own Cave Name',
        language: 'fra',
        isMain: true,
      }).fetch();
      try {
        const [doc] = await buildDocuments('caves', [cave.id]);
        should(doc.name).equal('Own Cave Name');
        should(doc.language).equal('fra');
      } finally {
        await TName.destroyOne({ id: name.id });
      }
    });
  });

  // A soft-deleted entity is embedded as the live one it was merged into
  // (redirect_to), and left out when it was never merged
  describe('soft-deleted embeds', () => {
    const named = async (model, owner, name, attributes = {}) => {
      const row = await model.create({ author: 1, ...attributes }).fetch();
      await TName.create({
        author: 1,
        [owner]: row.id,
        name,
        language: 'fra',
        isMain: true,
      });
      return row;
    };
    // Each kind: a live target, a row merged into it, a row deleted for good
    const kinds = {
      organization: {
        model: () => TGrotto,
        owner: 'grotto',
        attributes: { type: 'EDITION' },
      },
      massif: { model: () => TMassif, owner: 'massif' },
      cave: { model: () => TCave, owner: 'cave' },
      entrance: {
        model: () => TEntrance,
        owner: 'entrance',
        attributes: { cave: 1, latitude: 45.2, longitude: 6.2 },
      },
    };
    const rows = {};
    let liveEntrance;

    before(async () => {
      for (const [kind, { model, owner, attributes }] of Object.entries(
        kinds
      )) {
        /* eslint-disable no-await-in-loop */
        const live = await named(model(), owner, `Live ${kind}`, attributes);
        const merged = await named(model(), owner, `Merged ${kind}`, {
          ...attributes,
          isDeleted: true,
          redirectTo: live.id,
        });
        const gone = await named(model(), owner, `Gone ${kind}`, {
          ...attributes,
          isDeleted: true,
        });
        /* eslint-enable no-await-in-loop */
        rows[kind] = { live: live.id, merged: merged.id, gone: gone.id };
      }
      const { organization, massif, cave, entrance } = rows;

      // Document 5 is linked to the merged rows, to the target of one of them
      // and to the rows deleted for good
      await CommonService.query(
        'UPDATE t_document SET id_editor = $1, id_library = $2, id_cave = $3 WHERE id = 5',
        [organization.merged, organization.gone, cave.merged]
      );
      await CommonService.query(
        `INSERT INTO j_document_grotto_author (id_document, id_grotto)
         SELECT 5, unnest($1::int[])`,
        [[organization.merged, organization.live, organization.gone]]
      );
      await CommonService.query(
        `INSERT INTO j_document_entrance (id_document, id_entrance)
         SELECT 5, unnest($1::int[])`,
        [[entrance.merged, entrance.live, entrance.gone]]
      );
      await CommonService.query(
        `INSERT INTO j_document_massif (id_document, id_massif)
         SELECT 5, unnest($1::int[])`,
        [[massif.merged, massif.gone]]
      );

      liveEntrance = await named(TEntrance, 'entrance', 'Entrance', {
        cave: cave.merged,
        latitude: 45.3,
        longitude: 6.3,
      });
    });

    after(async () => {
      await CommonService.query(
        'UPDATE t_document SET id_editor = NULL, id_library = NULL, id_cave = NULL WHERE id = 5'
      );
      for (const table of [
        'j_document_grotto_author',
        'j_document_entrance',
        'j_document_massif',
      ]) {
        // eslint-disable-next-line no-await-in-loop
        await CommonService.query(`DELETE FROM ${table} WHERE id_document = 5`);
      }
      const ids = (kind) => Object.values(rows[kind]);
      await TName.destroy({ entrance: [...ids('entrance'), liveEntrance.id] });
      await TName.destroy({ cave: ids('cave') });
      await TName.destroy({ massif: ids('massif') });
      await TName.destroy({ grotto: ids('organization') });
      await TEntrance.destroy({ id: [...ids('entrance'), liveEntrance.id] });
      await TCave.destroy({ id: ids('cave') });
      await TMassif.destroy({ id: ids('massif') });
      // t_grotto soft-deletes on a first DELETE
      await CommonService.query('DELETE FROM t_grotto WHERE id = ANY($1)', [
        ids('organization'),
      ]);
      await CommonService.query('DELETE FROM t_grotto WHERE id = ANY($1)', [
        ids('organization'),
      ]);
    });

    it('embeds the organization a merged editor went into', async () => {
      const [doc] = await buildDocuments('documents', [5]);
      should(doc.editor).eql({
        name: 'Live organization',
        language: 'fra',
        type: 'EDITION',
      });
    });

    it('leaves out a deleted library that was never merged', async () => {
      const [doc] = await buildDocuments('documents', [5]);
      should(doc.library).be.null();
    });

    it('embeds each live author organization once', async () => {
      const [doc] = await buildDocuments('documents', [5]);
      should(doc.authorsOrganization).eql([
        { name: 'Live organization', type: 'EDITION' },
      ]);
    });

    it('embeds each live entrance once, by its own id', async () => {
      const [doc] = await buildDocuments('documents', [5]);
      should(doc.entrances).eql([
        { id: rows.entrance.live, name: 'Live entrance', language: 'fra' },
      ]);
    });

    it('embeds the massif a linked massif was merged into', async () => {
      const [doc] = await buildDocuments('documents', [5]);
      should(doc.massifs).eql([
        { id: rows.massif.live, name: 'Live massif', language: 'fra' },
      ]);
    });

    it('embeds the cave the document cave was merged into', async () => {
      const [doc] = await buildDocuments('documents', [5]);
      should(doc.cave).eql({ name: 'Live cave', language: 'fra' });
    });

    it('embeds the cave the entrance cave was merged into', async () => {
      const [doc] = await buildDocuments('entrances', [liveEntrance.id]);
      should(doc.cave.name).equal('Live cave');
      should(doc.cave.id).equal(rows.cave.live);
    });

    describe('cave deleted for good', () => {
      before(async () => {
        await CommonService.query(
          'UPDATE t_document SET id_cave = $1 WHERE id = 5',
          [rows.cave.gone]
        );
        await TEntrance.updateOne(liveEntrance.id).set({
          cave: rows.cave.gone,
        });
      });

      it('leaves the cave out of the document', async () => {
        const [doc] = await buildDocuments('documents', [5]);
        should(doc.cave).be.null();
      });

      it('leaves the cave out of the entrance', async () => {
        const [doc] = await buildDocuments('entrances', [liveEntrance.id]);
        should(doc.cave).be.null();
      });
    });
  });

  // Merges are not flattened on soft delete: A -> B -> C embeds C
  describe('merged twice', () => {
    let first;
    let second;
    let live;
    let entrance;

    before(async () => {
      live = await TCave.create({ author: 1 }).fetch();
      await TName.create({
        author: 1,
        cave: live.id,
        name: 'Final cave',
        language: 'fra',
        isMain: true,
      });
      second = await TCave.create({
        author: 1,
        isDeleted: true,
        redirectTo: live.id,
      }).fetch();
      first = await TCave.create({
        author: 1,
        isDeleted: true,
        redirectTo: second.id,
      }).fetch();
      entrance = await TEntrance.create({
        author: 1,
        cave: first.id,
        latitude: 45.4,
        longitude: 6.4,
      }).fetch();
      await CommonService.query(
        'UPDATE t_document SET id_cave = $1 WHERE id = 5',
        [first.id]
      );
    });

    after(async () => {
      await CommonService.query(
        'UPDATE t_document SET id_cave = NULL WHERE id = 5'
      );
      await TEntrance.destroyOne({ id: entrance.id });
      await TName.destroy({ cave: live.id });
      await TCave.destroy({ id: [first.id, second.id, live.id] });
    });

    it('embeds the cave at the end of the chain in an entrance', async () => {
      const [doc] = await buildDocuments('entrances', [entrance.id]);
      should(doc.cave.id).equal(live.id);
      should(doc.cave.name).equal('Final cave');
    });

    it('embeds the cave at the end of the chain in a document', async () => {
      const [doc] = await buildDocuments('documents', [5]);
      should(doc.cave).eql({ name: 'Final cave', language: 'fra' });
    });

    it('leaves out a cave whose merges loop', async () => {
      await TCave.updateOne(second.id).set({ redirectTo: first.id });
      try {
        const [doc] = await buildDocuments('entrances', [entrance.id]);
        should(doc.cave).be.null();
      } finally {
        await TCave.updateOne(second.id).set({ redirectTo: live.id });
      }
    });
  });

  describe('planSync()', () => {
    afterEach(async () => {
      await CommonService.query(
        'UPDATE t_document SET is_validated = true, is_deleted = false WHERE id = ANY($1::int[])',
        [[2, 3]]
      );
    });

    it('upserts the indexed ids and removes the missing ones', async () => {
      const { documents, removedIds } = await planSync('entrances', [
        '1',
        424242,
      ]);
      should(documents.map((d) => d.id)).eql([1]);
      should(removedIds).eql([424242]);
    });

    it('removes a soft-deleted device', async () => {
      const { documents, removedIds } = await planSync('devices', [2]);
      should(documents).eql([]);
      should(removedIds).eql([2]);
    });

    it('keeps a document pending re-validation in the index', async () => {
      await CommonService.query(
        'UPDATE t_document SET is_validated = false WHERE id = 2'
      );

      const { documents, removedIds } = await planSync('documents', [2, 4]);

      should(documents.map((d) => d.id)).eql([4]);
      should(removedIds).eql([]);
    });

    it('removes a soft-deleted document, validated or not', async () => {
      await CommonService.query(
        'UPDATE t_document SET is_deleted = true WHERE id = 2'
      );
      await CommonService.query(
        'UPDATE t_document SET is_deleted = true, is_validated = false WHERE id = 3'
      );

      const { documents, removedIds } = await planSync('documents', [2, 3]);

      should(documents).eql([]);
      should(removedIds).eql([2, 3]);
    });

    it('removes an unknown document', async () => {
      const { removedIds } = await planSync('documents', [424242]);
      should(removedIds).eql([424242]);
    });

    it('plans nothing without ids', async () => {
      should(await planSync('caves', [])).eql({
        documents: [],
        removedIds: [],
      });
    });
  });
});
