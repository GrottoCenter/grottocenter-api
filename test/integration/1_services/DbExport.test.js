const should = require('should');
const sinon = require('sinon');
const stream = require('stream');

const collectString = async (aStream) => {
  let data = '';
  for await (const chunk of aStream) data += chunk;
  return data;
};

describe('DbExport', () => {
  let CommonService;
  let FileService;
  let exportCollection;
  let makeDbExport;
  let entrance;
  let cave;
  let massif;
  let document;
  let organization;

  before(() => {
    // Required here, not at the top: Sails re-requires api/ when it lifts
    /* eslint-disable global-require */
    CommonService = require('../../../api/services/CommonService');
    FileService = require('../../../api/services/FileService');
    ({
      exportCollection,
      makeDbExport,
    } = require('../../../api/dbSync/dbExport'));
    entrance = require('../../../api/dbSync/entities/entrance');
    cave = require('../../../api/dbSync/entities/cave');
    massif = require('../../../api/dbSync/entities/massif');
    document = require('../../../api/dbSync/entities/document');
    organization = require('../../../api/dbSync/entities/organization');
    /* eslint-enable global-require */
  });

  afterEach(() => {
    sinon.restore();
  });

  const exportRows = async (collection) => {
    const { stream: out, promise } = exportCollection(collection);
    const [json] = await Promise.all([collectString(out), promise]);
    return JSON.parse(json);
  };

  describe('exportCollection()', () => {
    const created = {};

    before(async () => {
      // Entrance 1 has fixture locations, riggings and comments;
      // add the sub-entities it lacks. Entrance 6 is sensitive.
      created.entranceDescription = await TDescription.create({
        author: 1,
        title: 'Entrance 1 export description',
        body: 'Description body',
        language: 'eng',
        entrance: 1,
      }).fetch();
      created.history = await THistory.create({
        author: 1,
        body: 'Entrance 1 export history',
        language: 'eng',
        entrance: 1,
      }).fetch();
      created.sensitiveLocation = await TLocation.create({
        author: 1,
        title: 'Hidden location',
        body: 'Where the sensitive entrance is',
        language: 'eng',
        entrance: 6,
      }).fetch();
      created.caveDescription = await TDescription.create({
        author: 1,
        title: 'Cave 1 export description',
        body: 'Cave body',
        language: 'eng',
        cave: 1,
      }).fetch();
      created.massifDescription = await TDescription.create({
        author: 1,
        title: 'Massif 1 export description',
        body: 'Massif body',
        language: 'eng',
        massif: 1,
      }).fetch();
      await CommonService.query(
        'INSERT INTO j_document_entrance (id_document, id_entrance) VALUES (1, 1)'
      );
    });

    after(async () => {
      await TDescription.destroy({
        id: [
          created.entranceDescription.id,
          created.caveDescription.id,
          created.massifDescription.id,
        ],
      });
      await THistory.destroyOne(created.history.id);
      await TLocation.destroyOne(created.sensitiveLocation.id);
      await CommonService.query(
        'DELETE FROM j_document_entrance WHERE id_document = 1 AND id_entrance = 1'
      );
    });

    describe('entrances', () => {
      let rows;
      before(async () => {
        rows = await exportRows(entrance);
      });

      it('exports every non-deleted entrance once', () => {
        should(rows.map((e) => e.id).sort((a, b) => a - b)).eql([
          1, 2, 3, 4, 5, 6, 7, 8, 999,
        ]);
      });

      it('restores the full comments, not only their ratings', () => {
        const entrance1 = rows.find((e) => e.id === 1);
        should(entrance1.comments).have.length(3);
        for (const comment of entrance1.comments) {
          should(comment).have.properties([
            'title',
            'body',
            'aestheticism',
            'caving',
            'approach',
            'language',
            'author',
            'dateInscription',
          ]);
        }
        should(entrance1).not.have.property('exportComments');
      });

      it('restores locations, descriptions, riggings and histories', () => {
        const entrance1 = rows.find((e) => e.id === 1);
        should(entrance1.locations).have.length(2);
        should(entrance1.locations[0]).have.properties({ language: 'eng' });
        should(entrance1.riggings).have.length(1);
        should(entrance1.riggings[0]).have.properties([
          'obstacles',
          'ropes',
          'anchors',
          'observations',
        ]);
        const description = entrance1.descriptions.find(
          (e) => e.title === 'Entrance 1 export description'
        );
        should(description).have.properties({
          body: 'Description body',
          language: 'eng',
          authorId: 1,
          reviewerId: null,
        });
        should(description).have.properties([
          'dateInscription',
          'dateReviewed',
          'author',
          'reviewer',
        ]);
        should(entrance1.histories.map((e) => e.body)).containEql(
          'Entrance 1 export history'
        );
      });

      it('lists the ids of the documents linked to the entrance', () => {
        should(rows.find((e) => e.id === 1).documents).eql([1]);
      });

      it('hides the location and coordinates of a sensitive entrance', () => {
        const sensitive = rows.find((e) => e.id === 6);
        should(sensitive.isSensitive).be.true();
        should(sensitive.locations).eql([]);
        should(sensitive.latitude).be.null();
        should(sensitive.longitude).be.null();
      });

      it('leaves raw database values unformatted on every row', () => {
        for (const row of rows) {
          // importFormater turns the id into a string and adds numericId
          should(row.id).be.a.Number();
          should(row).not.have.property('numericId');
        }
      });

      it('writes the coordinates as numbers, not numeric strings', () => {
        const located = rows.filter((e) => !e.isSensitive);
        should(located).not.be.empty();
        for (const row of located) {
          should(row.latitude).be.a.Number();
          should(row.longitude).be.a.Number();
        }
      });
    });

    it('exports caves with their descriptions, documents and entrances', async () => {
      const cave1 = (await exportRows(cave)).find((e) => e.id === 1);
      should(cave1.descriptions.map((e) => e.title)).containEql(
        'Cave 1 export description'
      );
      should(cave1.documents).eql([6]);
      should(cave1.entrances.sort((a, b) => a - b)).eql([1, 2]);
      should(cave1.nbEntrances).equal(2);
    });

    it('exports massifs with their descriptions and documents', async () => {
      const massif1 = (await exportRows(massif)).find((e) => e.id === 1);
      should(massif1.descriptions.map((e) => e.title)).containEql(
        'Massif 1 export description'
      );
      should(massif1.documents).eql([1]);
      should(massif1.nbEntrances).be.a.Number();
    });

    it('exports organization coordinates and caver counts as numbers', async () => {
      const rows = await exportRows(organization);
      should(rows).not.be.empty();
      for (const row of rows) {
        should(row.nbCavers).be.a.Number();
        if (row.latitude !== null) should(row.latitude).be.a.Number();
        if (row.longitude !== null) should(row.longitude).be.a.Number();
      }
      should(rows.some((e) => typeof e.latitude === 'number')).be.true();
    });

    // https://github.com/GrottoCenter/grottocenter-api/issues/1923
    it('exports the OTHER type of an organization as is', async () => {
      // Organization 2 is an EDITION in the fixtures
      await TGrotto.updateOne({ id: 2 }).set({ type: 'OTHER' });
      try {
        const rows = await exportRows(organization);
        should(rows.find((e) => e.id === 2)).have.property('type', 'OTHER');
      } finally {
        await TGrotto.updateOne({ id: 2 }).set({ type: 'EDITION' });
      }
    });

    it('exports documents with their validated files', async () => {
      const document1 = (await exportRows(document)).find((e) => e.id === 1);
      should(document1.files.map((e) => e.url.split('/').pop()).sort()).eql([
        '12345678.mp4',
        '515679844298701.pdf',
        '98765432.pdf',
      ]);
      for (const file of document1.files) {
        should(Object.keys(file).sort()).eql(['filename', 'url']);
        should(file.url).containEql('/documents/');
      }
    });
  });

  describe('makeDbExport()', () => {
    let setMetadataStub;
    let uploaded;

    beforeEach(() => {
      uploaded = { chunks: [], stream: null };
      sinon.stub(FileService.dbExport, 'upload').callsFake(() => {
        const aStream = new stream.PassThrough();
        uploaded.stream = aStream;
        aStream.on('data', (c) => uploaded.chunks.push(c));
        const done = stream.promises.finished(aStream);
        return { stream: aStream, done };
      });
      setMetadataStub = sinon
        .stub(FileService.dbExport, 'setMetadata')
        .resolves(null);
    });

    it('uploads a zip of every exported collection and the licenses, then sets the metadata', async () => {
      await makeDbExport();

      const archive = Buffer.concat(uploaded.chunks);
      should(archive.subarray(0, 2).toString()).equal('PK');
      // Entry names are stored in clear in the zip central directory
      const content = archive.toString('latin1');
      for (const name of [
        'collections/massifs.json',
        'collections/entrances.json',
        'collections/caves.json',
        'collections/documents.json',
        'collections/organizations.json',
        'collections/devices.json',
        'license_en.txt',
        'license_fr.txt',
      ]) {
        should(content).containEql(name);
      }
      should(content).not.containEql('collections/persons.json');
      should(setMetadataStub.calledOnceWithExactly(archive.length)).be.true();
    });

    it('rejects and keeps the previous metadata when the upload fails', async () => {
      FileService.dbExport.upload.callsFake(() => {
        const aStream = new stream.PassThrough();
        aStream.once('data', () => aStream.destroy(new Error('upload failed')));
        return { stream: aStream, done: stream.promises.finished(aStream) };
      });

      await should(makeDbExport()).be.rejectedWith('upload failed');

      should(setMetadataStub.called).be.false();
    });

    it('aborts the upload and keeps the previous metadata when a collection fails', async () => {
      const failure = new Error('processRows failed');
      sinon.stub(entrance, 'processRows').callsFake(
        // eslint-disable-next-line require-yield
        async function* failingProcessRows() {
          throw failure;
        }
      );

      await should(makeDbExport()).be.rejectedWith(failure);

      // An errored upload stream is what keeps the blob from being committed
      should(uploaded.stream.destroyed).be.true();
      should(uploaded.stream.errored).be.ok();
      should(setMetadataStub.called).be.false();
    });
  });
});
