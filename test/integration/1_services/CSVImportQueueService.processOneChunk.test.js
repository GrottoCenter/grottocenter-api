const should = require('should');
const sinon = require('sinon');

describe('CSVImportQueueService - processOneChunk (DB integration)', () => {
  let originalBoss;
  let sendStub;
  let invalidateSpy;

  before(() => {
    // Stub pg-boss to prevent real completion queue enqueue
    originalBoss = sails.enrichmentBoss;
    sails.enrichmentBoss = { send: sinon.stub().resolves() };
    sendStub = sails.enrichmentBoss.send;
  });

  after(() => {
    sails.enrichmentBoss = originalBoss;
  });

  const makeJob = (rows) => ({
    data: {
      batchId: 'test-batch-integration',
      chunkIndex: 0,
      rows: rows.map((row, i) => ({ row, originalLine: i + 2 })),
      tokenMeta: { id: 1, groups: ['admin'] },
    },
  });

  describe('successful import', () => {
    let result;
    let createdEntranceId;
    let createdCaveId;

    before(async () => {
      invalidateSpy = sinon.spy(
        sails.services.coordinatessnapshotservice,
        'invalidate'
      );
      const job = makeJob([
        {
          id: '77770',
          'rdf:type': 'Entrance',
          'dct:rights/cc:attributionName': 'ProcessOneChunk Author',
          'dct:rights/karstlink:licenseType': 'CC-BY-SA',
          'gn:countryCode': 'FR',
          'w3geo:latitude': '46.5',
          'w3geo:longitude': '3.2',
          'rdfs:label/dc:language': 'eng',
          'rdfs:label': 'Chunk Test Entrance',
        },
      ]);
      result = await CSVImportQueueService.processOneChunk(job);
      if (result.successes.length > 0) {
        createdEntranceId = result.successes[0].entranceId;
        createdCaveId = result.successes[0].caveId;
      }
    });

    after(async () => {
      invalidateSpy.restore();
      // Clean up created records
      if (createdEntranceId) {
        await TName.destroy({ entrance: createdEntranceId });
        await TEntrance.destroy({ id: createdEntranceId });
      }
      if (createdCaveId) {
        await TName.destroy({ cave: createdCaveId });
        await TCave.destroy({ id: createdCaveId });
      }
    });

    it('should return one success', () => {
      should(result.successes).have.length(1);
      should(result.duplicates).have.length(0);
      should(result.failures).have.length(0);
    });

    it('should include cave and entrance IDs in the success entry', () => {
      should(result.successes[0]).have.property('caveId');
      should(result.successes[0]).have.property('entranceId');
      should(result.successes[0]).have.property('line', 2);
    });

    it('should have created an entrance in the database', async () => {
      const entrance = await TEntrance.findOne({ id: createdEntranceId });
      should(entrance).not.be.null();
      should(Number(entrance.latitude)).equal(46.5);
      should(Number(entrance.longitude)).equal(3.2);
    });

    it('should have created a cave in the database', async () => {
      const cave = await TCave.findOne({ id: createdCaveId });
      should(cave).not.be.null();
    });

    it('should call CoordinatesSnapshotService.invalidate()', () => {
      should(invalidateSpy.calledOnce).be.true();
    });

    it('should enqueue a completion check job', () => {
      const completionCalls = sendStub
        .getCalls()
        .filter((call) => call.args[0] === 'csv-import-completion');
      should(completionCalls).have.length(1);
      const [queueName, data] = completionCalls[0].args;
      should(queueName).equal('csv-import-completion');
      should(data.batchId).equal('test-batch-integration');
    });
  });

  describe('duplicate detection', () => {
    let existingEntrance;
    let existingCave;
    let result;

    before(async () => {
      invalidateSpy = sinon.spy(
        sails.services.coordinatessnapshotservice,
        'invalidate'
      );
      existingCave = await TCave.create({ author: 1 }).fetch();
      existingEntrance = await TEntrance.create({
        author: 1,
        idDbImport: 88880,
        nameDbImport: 'Dup Worker Author',
        latitude: 45.0,
        longitude: 6.0,
        cave: existingCave.id,
      }).fetch();

      const job = makeJob([
        {
          id: '88880',
          'rdf:type': 'Entrance',
          'dct:rights/cc:attributionName': 'Dup Worker Author',
          'dct:rights/karstlink:licenseType': 'CC-BY-SA',
          'gn:countryCode': 'FR',
          'w3geo:latitude': '45.0',
          'w3geo:longitude': '6.0',
          'rdfs:label/dc:language': 'eng',
          'rdfs:label': 'Duplicate Test',
        },
      ]);
      result = await CSVImportQueueService.processOneChunk(job);
    });

    after(async () => {
      invalidateSpy.restore();
      await TEntranceDuplicate.destroy({ entrance: existingEntrance.id });
      await TEntrance.destroy({ id: existingEntrance.id });
      await TCave.destroy({ id: existingCave.id });
    });

    it('should return one duplicate', () => {
      should(result.successes).have.length(0);
      should(result.duplicates).have.length(1);
      should(result.failures).have.length(0);
    });

    it('should include the line number and a meaningful message', () => {
      should(result.duplicates[0]).have.property('line', 2);
      should(result.duplicates[0].message).containEql('entrance duplicate');
    });

    it('should have created an EntranceDuplicate record', async () => {
      const dups = await TEntranceDuplicate.find({
        entrance: existingEntrance.id,
      });
      should(dups.length).be.aboveOrEqual(1);
    });

    it('should NOT call CoordinatesSnapshotService.invalidate()', () => {
      should(invalidateSpy.called).be.false();
    });
  });

  describe('missing columns', () => {
    let result;

    before(async () => {
      invalidateSpy = sinon.spy(
        sails.services.coordinatessnapshotservice,
        'invalidate'
      );
      const job = makeJob([
        {
          id: '99990',
          'rdf:type': 'Entrance',
          'dct:rights/cc:attributionName': 'Missing Cols Author',
          'dct:rights/karstlink:licenseType': 'CC-BY-SA',
          'gn:countryCode': 'FR',
          // Missing: w3geo:latitude, w3geo:longitude, rdfs:label/dc:language
        },
      ]);
      result = await CSVImportQueueService.processOneChunk(job);
    });

    after(() => {
      invalidateSpy.restore();
    });

    it('should return one failure', () => {
      should(result.successes).have.length(0);
      should(result.duplicates).have.length(0);
      should(result.failures).have.length(1);
    });

    it('should report missing columns', () => {
      should(result.failures[0]).have.property('line', 2);
      should(result.failures[0].message).containEql('Columns missing');
      should(result.failures[0].message).containEql('w3geo:latitude');
    });

    it('should NOT call CoordinatesSnapshotService.invalidate()', () => {
      should(invalidateSpy.called).be.false();
    });
  });

  describe('invalid data (graceful error handling)', () => {
    let result;

    before(async () => {
      invalidateSpy = sinon.spy(
        sails.services.coordinatessnapshotservice,
        'invalidate'
      );
      const job = makeJob([
        {
          id: '99991',
          'rdf:type': 'Entrance',
          'dct:rights/cc:attributionName': 'Invalid Data Author',
          'dct:rights/karstlink:licenseType': 'CC-BY-SA',
          'gn:countryCode': 'INVALID_LONG_CODE',
          'w3geo:latitude': 'not-a-number',
          'w3geo:longitude': '6.0',
          'rdfs:label/dc:language': 'eng',
          'rdfs:label': 'Invalid Entrance',
        },
      ]);
      result = await CSVImportQueueService.processOneChunk(job);
    });

    after(() => {
      invalidateSpy.restore();
    });

    it('should return one failure', () => {
      should(result.successes).have.length(0);
      should(result.duplicates).have.length(0);
      should(result.failures).have.length(1);
    });

    it('should include the line number', () => {
      should(result.failures[0]).have.property('line', 2);
    });

    it('should NOT call CoordinatesSnapshotService.invalidate()', () => {
      should(invalidateSpy.called).be.false();
    });
  });

  describe('mixed rows (success + failure + duplicate)', () => {
    let existingCave;
    let existingEntrance;
    let result;
    let createdEntranceId;
    let createdCaveId;

    before(async () => {
      invalidateSpy = sinon.spy(
        sails.services.coordinatessnapshotservice,
        'invalidate'
      );
      existingCave = await TCave.create({ author: 1 }).fetch();
      existingEntrance = await TEntrance.create({
        author: 1,
        idDbImport: 88881,
        nameDbImport: 'Mixed Dup Author',
        latitude: 45.0,
        longitude: 6.0,
        cave: existingCave.id,
      }).fetch();

      const job = makeJob([
        // Row 1: will succeed (line 2)
        {
          id: '77771',
          'rdf:type': 'Entrance',
          'dct:rights/cc:attributionName': 'Mixed Success Author',
          'dct:rights/karstlink:licenseType': 'CC-BY-SA',
          'gn:countryCode': 'FR',
          'w3geo:latitude': '47.0',
          'w3geo:longitude': '3.5',
          'rdfs:label/dc:language': 'eng',
          'rdfs:label': 'Mixed Success Entrance',
        },
        // Row 2: will fail — missing columns (line 3)
        {
          id: '77772',
          'rdf:type': 'Entrance',
          'dct:rights/cc:attributionName': 'Mixed Fail Author',
          'dct:rights/karstlink:licenseType': 'CC-BY-SA',
          'gn:countryCode': 'FR',
        },
        // Row 3: will be a duplicate (line 4)
        {
          id: '88881',
          'rdf:type': 'Entrance',
          'dct:rights/cc:attributionName': 'Mixed Dup Author',
          'dct:rights/karstlink:licenseType': 'CC-BY-SA',
          'gn:countryCode': 'FR',
          'w3geo:latitude': '45.0',
          'w3geo:longitude': '6.0',
          'rdfs:label/dc:language': 'eng',
          'rdfs:label': 'Mixed Dup Entrance',
        },
      ]);
      result = await CSVImportQueueService.processOneChunk(job);
      if (result.successes.length > 0) {
        createdEntranceId = result.successes[0].entranceId;
        createdCaveId = result.successes[0].caveId;
      }
    });

    after(async () => {
      invalidateSpy.restore();
      await TEntranceDuplicate.destroy({ entrance: existingEntrance.id });
      await TEntrance.destroy({ id: existingEntrance.id });
      await TCave.destroy({ id: existingCave.id });
      if (createdEntranceId) {
        await TName.destroy({ entrance: createdEntranceId });
        await TEntrance.destroy({ id: createdEntranceId });
      }
      if (createdCaveId) {
        await TName.destroy({ cave: createdCaveId });
        await TCave.destroy({ id: createdCaveId });
      }
    });

    it('should classify each row correctly', () => {
      should(result.successes).have.length(1);
      should(result.failures).have.length(1);
      should(result.duplicates).have.length(1);
    });

    it('should report correct line numbers', () => {
      should(result.successes[0].line).equal(2);
      should(result.failures[0].line).equal(3);
      should(result.duplicates[0].line).equal(4);
    });

    it('should call CoordinatesSnapshotService.invalidate() because there was a success', () => {
      should(invalidateSpy.calledOnce).be.true();
    });
  });
});
