const should = require('should');
const sinon = require('sinon');

describe('CSVImportQueueService', () => {
  describe('affinityChunk', () => {
    it('should place all rows in one chunk when under chunk size', () => {
      const rows = [
        { id: '1', 'dct:rights/cc:attributionName': 'A' },
        { id: '2', 'dct:rights/cc:attributionName': 'B' },
      ];
      const chunks = CSVImportQueueService.affinityChunk(rows, 50);
      should(chunks).have.length(1);
      should(chunks[0]).have.length(2);
    });

    it('should keep rows with the same key in the same chunk', () => {
      const rows = [];
      // 60 rows with key "1|||A" and 40 rows with key "2|||B"
      for (let i = 0; i < 60; i += 1) {
        rows.push({ id: '1', 'dct:rights/cc:attributionName': 'A' });
      }
      for (let i = 0; i < 40; i += 1) {
        rows.push({ id: '2', 'dct:rights/cc:attributionName': 'B' });
      }

      const chunks = CSVImportQueueService.affinityChunk(rows, 50);

      // All key-1 rows in one chunk, all key-2 rows in another
      for (const chunk of chunks) {
        const keys = new Set(
          chunk.map(
            (e) => `${e.row.id}|||${e.row['dct:rights/cc:attributionName']}`
          )
        );
        // Each chunk should only contain rows from one key group
        // (since group 1 has 60 rows > 50, it gets its own chunk)
        should(keys.size).be.belowOrEqual(2);
      }

      // Verify all 60 rows with key "1|||A" are in the same chunk
      const key1Chunks = chunks.filter((chunk) =>
        chunk.some((e) => e.row.id === '1')
      );
      should(key1Chunks).have.length(1);
      should(key1Chunks[0].filter((e) => e.row.id === '1')).have.length(60);
    });

    it('should distribute null-id rows freely across chunks', () => {
      const rows = [];
      for (let i = 0; i < 120; i += 1) {
        rows.push({ 'dct:rights/cc:attributionName': 'X' }); // no id
      }

      const chunks = CSVImportQueueService.affinityChunk(rows, 50);
      should(chunks.length).be.aboveOrEqual(2);

      // Total rows preserved
      const totalRows = chunks.reduce((sum, c) => sum + c.length, 0);
      should(totalRows).equal(120);
    });

    it('should keep a large group together even if it exceeds target size', () => {
      const rows = [];
      for (let i = 0; i < 80; i += 1) {
        rows.push({ id: 'big', 'dct:rights/cc:attributionName': 'group' });
      }

      const chunks = CSVImportQueueService.affinityChunk(rows, 50);
      // The group of 80 should be in a single chunk (not split)
      should(chunks).have.length(1);
      should(chunks[0]).have.length(80);
    });

    it('should return empty array for empty input', () => {
      const chunks = CSVImportQueueService.affinityChunk([], 50);
      should(chunks).have.length(0);
    });

    it('should preserve originalLine numbers correctly', () => {
      const rows = [
        { id: '1', 'dct:rights/cc:attributionName': 'A' },
        { id: '2', 'dct:rights/cc:attributionName': 'B' },
        { id: '3', 'dct:rights/cc:attributionName': 'C' },
      ];
      const chunks = CSVImportQueueService.affinityChunk(rows, 50);
      const allEntries = chunks.flat();
      should(allEntries[0].originalLine).equal(2); // index 0 + 2
      should(allEntries[1].originalLine).equal(3);
      should(allEntries[2].originalLine).equal(4);
    });
  });

  describe('toCSV', () => {
    it('should produce correct header and rows', () => {
      const result = CSVImportQueueService.toCSV(
        ['line', 'message'],
        [
          { line: 2, message: 'ok' },
          { line: 3, message: 'fail' },
        ]
      );
      should(result).equal('line,message\n2,ok\n3,fail');
    });

    it('should escape values with commas', () => {
      const result = CSVImportQueueService.toCSV(
        ['msg'],
        [{ msg: 'hello, world' }]
      );
      should(result).equal('msg\n"hello, world"');
    });

    it('should escape values with quotes', () => {
      const result = CSVImportQueueService.toCSV(
        ['msg'],
        [{ msg: 'say "hi"' }]
      );
      should(result).equal('msg\n"say ""hi"""');
    });

    it('should escape values with newlines', () => {
      const result = CSVImportQueueService.toCSV(
        ['msg'],
        [{ msg: 'line1\nline2' }]
      );
      should(result).equal('msg\n"line1\nline2"');
    });

    it('should handle null and undefined values', () => {
      const result = CSVImportQueueService.toCSV(
        ['a', 'b'],
        [{ a: null, b: undefined }]
      );
      should(result).equal('a,b\n,');
    });

    it('should handle empty rows array', () => {
      const result = CSVImportQueueService.toCSV(['line', 'message'], []);
      should(result).equal('line,message\n');
    });
  });

  describe('createBatch', () => {
    let sendStub;
    let createStub;
    let updateStub;
    let originalBoss;

    before(() => {
      originalBoss = sails.enrichmentBoss;
      sails.enrichmentBoss = { send: sinon.stub().resolves() };
      sendStub = sails.enrichmentBoss.send;
      createStub = sinon.stub(TJobBatch, 'create').resolves();
      updateStub = sinon
        .stub(TJobBatch, 'updateOne')
        .returns({ set: sinon.stub().resolves() });
    });

    after(() => {
      sails.enrichmentBoss = originalBoss;
      createStub.restore();
      updateStub.restore();
    });

    afterEach(() => {
      sendStub.resetHistory();
      createStub.resetHistory();
      updateStub.resetHistory();
    });

    it('should create a batch record and enqueue chunks', async () => {
      const rows = [];
      for (let i = 0; i < 120; i += 1) {
        rows.push({ id: `${i}`, 'dct:rights/cc:attributionName': 'A' });
      }

      const result = await CSVImportQueueService.createBatch(rows, {
        id: 1,
        groups: ['admin'],
      });

      should(result).have.property('batchId');
      should(result.totalRows).equal(120);
      should(result.totalChunks).be.above(1);

      // TJobBatch.create called once
      should(createStub.callCount).equal(1);
      const createArgs = createStub.firstCall.args[0];
      should(createArgs.type).equal('csv-import');
      should(createArgs.status).equal('pending');
      should(createArgs.totalRows).equal(120);

      // send called for each chunk
      should(sendStub.callCount).equal(result.totalChunks);
    });
  });

  describe('checkBatchCompletion', () => {
    let findOneStub;
    let queryStub;
    let updateStub;
    let aggregateStub;
    let notifyStub;

    before(() => {
      findOneStub = sinon
        .stub(TJobBatch, 'findOne')
        .resolves({ id: 'batch-123', totalChunks: 2, totalRows: 100 });
      queryStub = sinon.stub(CommonService, 'query');
      updateStub = sinon
        .stub(TJobBatch, 'updateOne')
        .returns({ set: sinon.stub().resolves({ id: 'batch-123' }) });
      aggregateStub = sinon
        .stub(CSVImportQueueService, 'aggregateBatch')
        .resolves();
      notifyStub = sinon
        .stub(CSVImportQueueService, 'notifyCompletion')
        .resolves();
    });

    after(() => {
      findOneStub.restore();
      queryStub.restore();
      updateStub.restore();
      aggregateStub.restore();
      notifyStub.restore();
    });

    afterEach(() => {
      findOneStub.resetHistory();
      queryStub.resetHistory();
      updateStub.resetHistory();
      aggregateStub.resetHistory();
      notifyStub.resetHistory();
    });

    it('should return early when batch is not found', async () => {
      findOneStub.resolves(null);
      await CSVImportQueueService.checkBatchCompletion('unknown');
      should(queryStub.callCount).equal(0);
      should(aggregateStub.callCount).equal(0);
      findOneStub.resolves({ id: 'batch-123', totalChunks: 2, totalRows: 100 });
    });

    it('should not aggregate when fewer chunks exist than totalChunks', async () => {
      queryStub.resolves({
        rows: [{ state: 'completed', output: {} }],
      });

      await CSVImportQueueService.checkBatchCompletion('batch-123');
      should(aggregateStub.callCount).equal(0);
    });

    it('should not aggregate when not all jobs are done', async () => {
      queryStub.resolves({
        rows: [
          { state: 'completed', output: {} },
          { state: 'active', output: null },
        ],
      });

      await CSVImportQueueService.checkBatchCompletion('batch-123');
      should(aggregateStub.callCount).equal(0);
    });

    it('should aggregate when all jobs are completed', async () => {
      queryStub.resolves({
        rows: [
          {
            state: 'completed',
            output: { successes: [], duplicates: [], failures: [] },
          },
          {
            state: 'completed',
            output: { successes: [], duplicates: [], failures: [] },
          },
        ],
      });

      await CSVImportQueueService.checkBatchCompletion('batch-123');
      should(aggregateStub.callCount).equal(1);
    });

    it('should set status to failed and notify when all jobs failed', async () => {
      queryStub.resolves({
        rows: [
          { state: 'failed', output: null },
          { state: 'failed', output: null },
        ],
      });

      await CSVImportQueueService.checkBatchCompletion('batch-123');
      should(updateStub.callCount).equal(1);
      should(aggregateStub.callCount).equal(0);
      should(notifyStub.callCount).equal(1);
      const notifyArgs = notifyStub.firstCall.args;
      should(notifyArgs[0]).equal('batch-123');
      should(notifyArgs[1].summary.failures).equal(100);
      should(notifyArgs[1].summary.successes).equal(0);
    });
  });

  describe('aggregateBatch', () => {
    let findOneStub;
    let updateStub;
    let generateStub;
    let notifyStub;
    let setStub;

    before(() => {
      findOneStub = sinon
        .stub(TJobBatch, 'findOne')
        .resolves({ id: 'batch-abc', totalChunks: 1, totalRows: 2 });
      setStub = sinon.stub().resolves({ id: 'batch-abc' });
      updateStub = sinon.stub(TJobBatch, 'updateOne').returns({ set: setStub });
      generateStub = sinon.stub(
        CSVImportQueueService,
        'generateAndUploadReports'
      );
      notifyStub = sinon
        .stub(CSVImportQueueService, 'notifyCompletion')
        .resolves();
    });

    after(() => {
      findOneStub.restore();
      updateStub.restore();
      generateStub.restore();
      notifyStub.restore();
    });

    afterEach(() => {
      findOneStub.resetHistory();
      updateStub.resetHistory();
      setStub.resetHistory();
      generateStub.resetHistory();
      notifyStub.resetHistory();
    });

    it('should mark batch as completed with null reportUrls when report upload fails', async () => {
      const jobs = [
        {
          state: 'completed',
          output: {
            successes: [{ line: 2, caveId: 10, entranceId: 20 }],
            duplicates: [],
            failures: [],
          },
          data: { batchId: 'batch-abc', rows: [{}] },
        },
        {
          state: 'completed',
          output: {
            successes: [],
            duplicates: [],
            failures: [{ line: 3, message: 'Missing column' }],
          },
          data: { batchId: 'batch-abc', rows: [{}] },
        },
      ];

      generateStub.rejects(new Error('Azure upload failed'));

      await CSVImportQueueService.aggregateBatch('batch-abc', jobs);

      // Batch must be marked completed, not failed
      should(updateStub.callCount).equal(1);
      should(setStub.callCount).equal(1);
      const setArgs = setStub.firstCall.args[0];
      should(setArgs.status).equal('completed');
      should(setArgs.result).not.be.null();
      should(setArgs.result.summary.successes).equal(1);
      should(setArgs.result.summary.failures).equal(1);
      should(setArgs.result.reportUrls.successes).be.null();
      should(setArgs.result.reportUrls.duplicates).be.null();
      should(setArgs.result.reportUrls.failures).be.null();

      // Notification must still be sent
      should(notifyStub.callCount).equal(1);
      const notifyArgs = notifyStub.firstCall.args;
      should(notifyArgs[0]).equal('batch-abc');
      should(notifyArgs[1].summary.successes).equal(1);
    });

    it('should mark batch as completed with reportUrls when upload succeeds', async () => {
      const jobs = [
        {
          state: 'completed',
          output: {
            successes: [{ line: 2, caveId: 10, entranceId: 20 }],
            duplicates: [],
            failures: [],
          },
          data: { batchId: 'batch-abc', rows: [{}] },
        },
      ];

      const urls = {
        successes: 'https://example.com/s.csv',
        duplicates: null,
        failures: null,
      };
      generateStub.resolves(urls);

      await CSVImportQueueService.aggregateBatch('batch-abc', jobs);

      should(updateStub.callCount).equal(1);
      should(setStub.callCount).equal(1);
      const setArgs = setStub.firstCall.args[0];
      should(setArgs.status).equal('completed');
      should(setArgs.result.reportUrls.successes).equal(
        'https://example.com/s.csv'
      );
      should(setArgs.result.summary.successes).equal(1);
      should(notifyStub.callCount).equal(1);
    });
  });

  describe('getBatchProgress', () => {
    let findOneStub;
    let queryStub;

    before(() => {
      findOneStub = sinon.stub(TJobBatch, 'findOne');
      queryStub = sinon.stub(CommonService, 'query');
    });

    after(() => {
      findOneStub.restore();
      queryStub.restore();
    });

    afterEach(() => {
      findOneStub.resetHistory();
      queryStub.resetHistory();
    });

    it('should return null for unknown batch', async () => {
      findOneStub.resolves(null);
      const result = await CSVImportQueueService.getBatchProgress('unknown');
      should(result).be.null();
    });

    it('should return correct aggregate counts', async () => {
      findOneStub.resolves({ totalChunks: 2, totalRows: 100 });
      queryStub.resolves({
        rows: [
          {
            state: 'completed',
            output: { successes: [1, 2, 3], duplicates: [4], failures: [] },
          },
          {
            state: 'completed',
            output: { successes: [5, 6], duplicates: [], failures: [7] },
          },
        ],
      });

      const progress = await CSVImportQueueService.getBatchProgress('batch-1');
      should(progress.totalChunks).equal(2);
      should(progress.completedChunks).equal(2);
      should(progress.totalRows).equal(100);
      should(progress.processedRows).equal(7);
      should(progress.successes).equal(5);
      should(progress.duplicates).equal(1);
      should(progress.failures).equal(1);
    });

    it('should count failed chunks toward completedChunks using rows.length from job data', async () => {
      findOneStub.resolves({ totalChunks: 3, totalRows: 150 });
      queryStub.resolves({
        rows: [
          {
            state: 'completed',
            data: { batchId: 'batch-1', rows: new Array(50) },
            output: { successes: [1, 2], duplicates: [], failures: [] },
          },
          {
            state: 'failed',
            data: { batchId: 'batch-1', rows: new Array(50) },
            output: null,
          },
          {
            state: 'completed',
            data: { batchId: 'batch-1', rows: new Array(50) },
            output: { successes: [3], duplicates: [4], failures: [5] },
          },
        ],
      });

      const progress = await CSVImportQueueService.getBatchProgress('batch-1');
      should(progress.totalChunks).equal(3);
      should(progress.completedChunks).equal(3);
      // processedRows = 5 (from completed) + 50 (rows.length of failed chunk) = 55
      should(progress.processedRows).equal(55);
      should(progress.successes).equal(3);
      should(progress.duplicates).equal(1);
      // failures = 1 (from completed chunks) + 50 (rows.length of failed chunk) = 51
      should(progress.failures).equal(51);
    });
  });
});
