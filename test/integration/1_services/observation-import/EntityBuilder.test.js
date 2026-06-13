/* eslint-disable func-names */
/**
 * Unit tests for EntityBuilder.
 *
 * All Waterline models and external services are stubbed.
 *
 * Tests:
 *  - Transaction rollback: when a DB operation throws, later stubs are NOT called
 *  - Point reuse: when TPoint.findOne returns a record, TPoint.create is NOT called
 *  - Document title fallback: when documentTitle is missing, uses filename without extension
 *  - Observation name: TName created when non-whitespace, not created when empty/null/whitespace
 *  - File archive failure: when FileService.document.create throws, the error propagates
 *  - Profile JSON file content: uploaded profile contains metadata with entity IDs and enriched column mappings
 */
const should = require('should');
const sinon = require('sinon');
const FileService = require('../../../../api/services/FileService');
const EntityBuilder = require('../../../../api/services/observation-import/EntityBuilder');

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function buildMinimalParams(overrides = {}) {
  const timestamps = [
    new Date('2024-01-15T08:00:00Z'),
    new Date('2024-01-15T09:00:00Z'),
  ];
  const measurements = timestamps.map(() => [
    { columnIndex: 1, value: 21.5, valueSi: 294.65 },
  ]);

  return {
    parsedData: { rows: [], timestamps, measurements },
    profile: {
      timezone: 'Europe/Paris',
      caveId: 1,
      pointLabel: 'Test Point',
      authorIds: [7],
      licenseId: 1,
      dataQuality: 'raw',
      documentTitle: 'My Doc Title',
      columnMappings: [
        { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
        {
          columnIndex: 1,
          role: 'measurement',
          sensorConfigurationId: 10,
          mediumId: 5,
        },
      ],
      ...overrides,
    },
    resolvedEntities: {
      cave: { id: 1 },
      license: { id: 1 },
      authors: [{ id: 7 }],
      media: new Map([[5, { id: 5, code: 'air' }]]),
      sensorConfigs: new Map([
        [
          10,
          {
            id: 10,
            unit: { id: 3, symbol: '°C' },
            quantityKind: { id: 1, code: 'temperature' },
          },
        ],
      ]),
    },
    file: {
      buffer: Buffer.from('test,data'),
      originalname: 'temperature_2024.csv',
      size: 9,
    },
    requestAuthorId: 7,
  };
}

function installDefaultStubs(overrides = {}) {
  const tracker = {
    pointFindOneCalled: false,
    pointCreateCalled: false,
    timeSeriesCreateCalled: false,
    qualityLogCreateCalled: false,
    observationCreateCalled: false,
    documentCreateCalled: false,
    descriptionCreateCalled: false,
    junctionCreateCalled: false,
    nameCreateCalled: false,
    fileServiceCalled: false,
  };

  sinon.stub(sails, 'getDatastore').returns({
    transaction: async (fn) => fn('mock-db'),
  });

  sinon.stub(TPoint, 'findOne').callsFake(() => ({
    usingConnection: () => {
      tracker.pointFindOneCalled = true;
      return Promise.resolve(overrides.existingPoint || null);
    },
  }));
  sinon.stub(TPoint, 'create').callsFake(() => ({
    usingConnection: () => ({
      fetch: () => {
        tracker.pointCreateCalled = true;
        return Promise.resolve({
          id: 99,
          label: 'Test Point',
          latitude: null,
          longitude: null,
        });
      },
    }),
  }));

  sinon.stub(TName, 'findOne').callsFake(() => ({
    usingConnection: () =>
      Promise.resolve(
        overrides.caveName ? { id: 500, name: overrides.caveName } : null
      ),
  }));
  sinon.stub(TName, 'create').callsFake(() => ({
    usingConnection: () => {
      tracker.nameCreateCalled = true;
      return Promise.resolve({ id: 501 });
    },
  }));

  sinon.stub(TObservationType, 'findOne').callsFake(() => ({
    usingConnection: () =>
      Promise.resolve({ id: 1, code: 'physical_measurements' }),
  }));

  sinon.stub(TObservation, 'create').callsFake((data) => ({
    usingConnection: () => ({
      fetch: () => {
        tracker.observationCreateCalled = true;
        return Promise.resolve({
          id: 100,
          observationDate: data.observationDate,
          observationTypeCode: data.observationTypeCode,
        });
      },
    }),
  }));

  sinon.stub(TDocument, 'create').callsFake(() => ({
    usingConnection: () => ({
      fetch: () => {
        tracker.documentCreateCalled = true;
        return Promise.resolve({ id: 200 });
      },
    }),
  }));

  sinon.stub(TDescription, 'create').callsFake(() => ({
    usingConnection: () => {
      tracker.descriptionCreateCalled = true;
      return Promise.resolve({ id: 998 });
    },
  }));

  sinon.stub(JDocumentCaverAuthor, 'create').callsFake(() => ({
    usingConnection: () => {
      tracker.junctionCreateCalled = true;
      return Promise.resolve({});
    },
  }));

  sinon.stub(TTimeSeries, 'create').callsFake((data) => ({
    usingConnection: () => ({
      fetch: () => {
        tracker.timeSeriesCreateCalled = true;
        return Promise.resolve({ id: 300, ...data });
      },
    }),
  }));

  sinon
    .stub(CommonService, 'query')
    .callsFake(() => Promise.resolve({ rows: [] }));

  sinon.stub(TTimeSeriesQualityLog, 'create').callsFake(() => ({
    usingConnection: () => {
      tracker.qualityLogCreateCalled = true;
      return Promise.resolve({ id: 400 });
    },
  }));

  sinon.stub(FileService.document, 'create').callsFake(() => {
    if (overrides.fileServiceError) {
      return Promise.reject(overrides.fileServiceError);
    }
    tracker.fileServiceCalled = true;
    return Promise.resolve();
  });

  return tracker;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EntityBuilder', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('Transaction rollback on failure', () => {
    it('should propagate error and not call subsequent stubs when observation creation fails', async () => {
      sinon.stub(sails, 'getDatastore').returns({
        transaction: async (fn) => fn('mock-db'),
      });
      sinon.stub(TPoint, 'findOne').callsFake(() => ({
        usingConnection: () => Promise.resolve(null),
      }));
      sinon.stub(TPoint, 'create').callsFake(() => ({
        usingConnection: () => ({
          fetch: () =>
            Promise.resolve({
              id: 99,
              label: 'Test Point',
              latitude: null,
              longitude: null,
            }),
        }),
      }));
      sinon.stub(TName, 'findOne').callsFake(() => ({
        usingConnection: () => Promise.resolve(null),
      }));
      sinon.stub(TObservationType, 'findOne').callsFake(() => ({
        usingConnection: () =>
          Promise.resolve({ id: 1, code: 'physical_measurements' }),
      }));
      sinon.stub(TObservation, 'create').callsFake(() => ({
        usingConnection: () => ({
          fetch: () => Promise.reject(new Error('DB connection lost')),
        }),
      }));

      const documentCreateStub = sinon.stub(TDocument, 'create');
      const timeSeriesCreateStub = sinon.stub(TTimeSeries, 'create');
      const fileServiceStub = sinon.stub(FileService.document, 'create');

      const params = buildMinimalParams();

      let error;
      try {
        await EntityBuilder.build(params);
      } catch (e) {
        error = e;
      }

      should(error).be.ok();
      should(error.message).equal('DB connection lost');
      should(documentCreateStub.called).be.false(
        'TDocument.create should not be called after failure'
      );
      should(timeSeriesCreateStub.called).be.false(
        'TTimeSeries.create should not be called after failure'
      );
      should(fileServiceStub.called).be.false(
        'FileService should not be called after failure'
      );
    });
  });

  describe('Point reuse', () => {
    it('should NOT call TPoint.create when TPoint.findOne returns a record', async () => {
      const tracker = installDefaultStubs({
        existingPoint: {
          id: 42,
          label: 'Test Point',
          latitude: '43.5',
          longitude: '2.8',
        },
      });

      const params = buildMinimalParams();
      const result = await EntityBuilder.build(params);

      should(tracker.pointFindOneCalled).be.true();
      should(tracker.pointCreateCalled).be.false();
      should(result.pointId).equal(42);
    });

    it('should call TPoint.create when TPoint.findOne returns null', async () => {
      const tracker = installDefaultStubs({
        existingPoint: null,
      });

      const params = buildMinimalParams();
      const result = await EntityBuilder.build(params);

      should(tracker.pointFindOneCalled).be.true();
      should(tracker.pointCreateCalled).be.true();
      should(result.pointId).equal(99);
    });
  });

  describe('Document title fallback', () => {
    it('should use documentTitle when provided and non-whitespace', async () => {
      const title = EntityBuilder.deriveDocumentTitle(
        'My Custom Title',
        'file.csv'
      );
      should(title).equal('My Custom Title');
    });

    it('should use filename without extension when documentTitle is empty', async () => {
      const title = EntityBuilder.deriveDocumentTitle(
        '',
        'temperature_2024.csv'
      );
      should(title).equal('temperature_2024');
    });

    it('should use filename without extension when documentTitle is whitespace-only', async () => {
      const title = EntityBuilder.deriveDocumentTitle('   ', 'data_export.txt');
      should(title).equal('data_export');
    });

    it('should use filename without extension when documentTitle is undefined', async () => {
      const title = EntityBuilder.deriveDocumentTitle(
        undefined,
        'measurements.tsv'
      );
      should(title).equal('measurements');
    });

    it('should handle filenames without extension', async () => {
      const title = EntityBuilder.deriveDocumentTitle(undefined, 'data');
      should(title).equal('data');
    });
  });

  describe('Observation name (TName creation)', () => {
    it('should create TName when observationName is non-whitespace', async () => {
      const tracker = installDefaultStubs();
      const params = buildMinimalParams({
        observationName: 'Campaign Jan 2024',
      });
      await EntityBuilder.build(params);

      should(tracker.nameCreateCalled).be.true();
    });

    it('should NOT create TName when observationName is empty string', async () => {
      const tracker = installDefaultStubs();
      const params = buildMinimalParams({ observationName: '' });
      await EntityBuilder.build(params);

      should(tracker.nameCreateCalled).be.false();
    });

    it('should NOT create TName when observationName is null', async () => {
      const tracker = installDefaultStubs();
      const params = buildMinimalParams({ observationName: null });
      await EntityBuilder.build(params);

      should(tracker.nameCreateCalled).be.false();
    });

    it('should NOT create TName when observationName is whitespace-only', async () => {
      const tracker = installDefaultStubs();
      const params = buildMinimalParams({ observationName: '   \t  ' });
      await EntityBuilder.build(params);

      should(tracker.nameCreateCalled).be.false();
    });

    it('should NOT create TName when observationName is not provided', async () => {
      const tracker = installDefaultStubs();
      const params = buildMinimalParams();
      // No observationName in profile
      delete params.profile.observationName;
      await EntityBuilder.build(params);

      should(tracker.nameCreateCalled).be.false();
    });
  });

  describe('File archive failure', () => {
    it('should propagate the error when FileService.document.create throws', async () => {
      const fileError = new Error('Azure upload failed');
      installDefaultStubs({ fileServiceError: fileError });

      const params = buildMinimalParams();

      let error;
      try {
        await EntityBuilder.build(params);
      } catch (e) {
        error = e;
      }

      should(error).be.ok();
      should(error.message).equal('Azure upload failed');
    });
  });

  describe('ImportResult shape', () => {
    it('should return correct ImportResult structure', async () => {
      installDefaultStubs();
      const params = buildMinimalParams();
      const result = await EntityBuilder.build(params);

      should(result).have.property('observationId', 100);
      should(result).have.property('pointId', 99);
      should(result).have.property('documentId', 200);
      should(result).have.property('timeSeriesMap');
      should(result.timeSeriesMap).be.an.Object();
      should(Object.keys(result.timeSeriesMap).length).equal(1);
      should(result.timeSeriesMap).have.property('1', 300);
      should(result).have.property('measurementCount', 2);
      should(result).have.property('observationDate');
      should(result.observationDate).be.a.Date();
      should(result).have.property('importedAt');
      should(result.importedAt).be.a.Date();
      should(result).have.property('importedBy', 7);
    });
  });

  describe('Profile JSON file content', () => {
    it('should embed metadata with entity IDs at the root of the profile', async () => {
      const fileServiceCalls = [];
      installDefaultStubs();
      // Replace the FileService stub to capture call arguments
      FileService.document.create.restore();
      sinon.stub(FileService.document, 'create').callsFake((f) => {
        fileServiceCalls.push(f);
        return Promise.resolve();
      });

      const params = buildMinimalParams();
      await EntityBuilder.build(params);

      // Second call is the profile JSON (first is the raw data file)
      should(fileServiceCalls.length).equal(2);
      const profileFile = fileServiceCalls[1];
      should(profileFile.originalname).equal('temperature_2024-profile.json');
      should(profileFile.mimetype).equal('application/json');

      const profileJson = JSON.parse(profileFile.buffer.toString('utf8'));

      // Root-level metadata with entity IDs
      should(profileJson).have.property('metadata');
      should(profileJson.metadata).have.property('observationId', 100);
      should(profileJson.metadata).have.property('pointId', 99);
      should(profileJson.metadata).have.property('documentId', 200);
      should(profileJson.metadata).have.property('timeSeriesMap');
      should(profileJson.metadata.timeSeriesMap).have.property('1', 300);
      should(profileJson.metadata).have.property('measurementCount', 2);
      should(profileJson.metadata).have.property('observationDate');
      should(profileJson.metadata).have.property('importedAt');
      should(profileJson.metadata).have.property('importedBy', 7);
    });

    it('should enrich measurement columnMappings with quantityKind, unit, and medium metadata', async () => {
      const fileServiceCalls = [];
      installDefaultStubs();
      FileService.document.create.restore();
      sinon.stub(FileService.document, 'create').callsFake((f) => {
        fileServiceCalls.push(f);
        return Promise.resolve();
      });

      const params = buildMinimalParams();
      await EntityBuilder.build(params);

      const profileJson = JSON.parse(
        fileServiceCalls[1].buffer.toString('utf8')
      );

      const measurementCol = profileJson.columnMappings.find(
        (col) => col.role === 'measurement'
      );
      should(measurementCol).have.property('metadata');
      should(measurementCol.metadata).have.property('quantityKind');
      should(measurementCol.metadata.quantityKind).have.property('id', 1);
      should(measurementCol.metadata.quantityKind).have.property(
        'code',
        'temperature'
      );
      should(measurementCol.metadata).have.property('unit');
      should(measurementCol.metadata.unit).have.property('id', 3);
      should(measurementCol.metadata.unit).have.property('symbol', '°C');
      should(measurementCol.metadata).have.property('medium');
      should(measurementCol.metadata.medium).have.property('id', 5);
      should(measurementCol.metadata.medium).have.property('code', 'air');
    });

    it('should not add metadata to non-measurement columnMappings', async () => {
      const fileServiceCalls = [];
      installDefaultStubs();
      FileService.document.create.restore();
      sinon.stub(FileService.document, 'create').callsFake((f) => {
        fileServiceCalls.push(f);
        return Promise.resolve();
      });

      const params = buildMinimalParams();
      await EntityBuilder.build(params);

      const profileJson = JSON.parse(
        fileServiceCalls[1].buffer.toString('utf8')
      );

      const timestampCol = profileJson.columnMappings.find(
        (col) => col.role === 'timestamp'
      );
      should(timestampCol).not.have.property('metadata');
    });

    it('should preserve original profile fields in the uploaded JSON', async () => {
      const fileServiceCalls = [];
      installDefaultStubs();
      FileService.document.create.restore();
      sinon.stub(FileService.document, 'create').callsFake((f) => {
        fileServiceCalls.push(f);
        return Promise.resolve();
      });

      const params = buildMinimalParams();
      await EntityBuilder.build(params);

      const profileJson = JSON.parse(
        fileServiceCalls[1].buffer.toString('utf8')
      );

      should(profileJson).have.property('timezone', 'Europe/Paris');
      should(profileJson).have.property('caveId', 1);
      should(profileJson).have.property('pointLabel', 'Test Point');
      should(profileJson).have.property('dataQuality', 'raw');
      should(profileJson).have.property('documentTitle', 'My Doc Title');
    });
  });
});
