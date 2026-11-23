const should = require('should');
const sinon = require('sinon');
const EnrichmentQueueService = require('../../../api/services/EnrichmentQueueService');

describe('EnrichmentQueueService', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('enqueue()', () => {
    it('should call boss.send with correct queue name, payload, and singletonKey', async () => {
      const sendStub = sinon.stub().resolves('job-id');
      EnrichmentQueueService.setBoss({ send: sendStub });

      await EnrichmentQueueService.enqueue(42, 'entrance', 'test-trace-id');

      should(sendStub.calledOnce).be.true();
      should(sendStub.firstCall.args[0]).equal('geocoding-enrichment');
      should(sendStub.firstCall.args[1]).deepEqual({
        entityId: 42,
        entityType: 'entrance',
        traceId: 'test-trace-id',
      });
      should(sendStub.firstCall.args[2]).deepEqual({
        singletonKey: 'entrance-42',
      });

      EnrichmentQueueService.setBoss(null);
    });

    it('should log warning and return without error when boss is null', async () => {
      EnrichmentQueueService.setBoss(null);
      const warnStub = sinon.stub(sails.log, 'warn');

      await EnrichmentQueueService.enqueue(42, 'entrance');

      should(warnStub.calledOnce).be.true();
      should(warnStub.firstCall.args[0]).match(/queue not initialized/);
    });
  });

  describe('getConnectionString()', () => {
    const OVERRIDE = 'ENRICHMENT_QUEUE_DATABASE_URL';
    let savedDefault;
    let savedOverride;

    beforeEach(() => {
      savedDefault = sails.config.datastores.default;
      savedOverride = process.env[OVERRIDE];
      delete process.env[OVERRIDE];
    });

    afterEach(() => {
      sails.config.datastores.default = savedDefault;
      if (savedOverride === undefined) delete process.env[OVERRIDE];
      else process.env[OVERRIDE] = savedOverride;
    });

    const withDatastore = (config) => {
      sails.config.datastores.default = { ...savedDefault, ...config };
      return EnrichmentQueueService.getConnectionString();
    };

    it('should return the override when it is set', () => {
      process.env[OVERRIDE] = 'postgres://o:o@h:1/d?sslmode=require';
      should(
        withDatastore({ url: 'postgres://u:p@h:5432/d', ssl: true })
      ).equal('postgres://o:o@h:1/d?sslmode=require');
    });

    it('should add sslmode=verify-full to a full URI when the datastore uses ssl', () => {
      should(
        withDatastore({ url: 'postgres://u:p@h:5432/d', ssl: true })
      ).equal('postgres://u:p@h:5432/d?sslmode=verify-full');
    });

    it('should append with & when the URI already has a query string', () => {
      should(
        withDatastore({ url: 'postgres://u:p@h:5432/d?x=1', ssl: true })
      ).equal('postgres://u:p@h:5432/d?x=1&sslmode=verify-full');
    });

    it('should use no-verify when the datastore skips certificate verification', () => {
      should(
        withDatastore({
          url: 'postgres://u:p@h:5432/d',
          ssl: { rejectUnauthorized: false },
        })
      ).equal('postgres://u:p@h:5432/d?sslmode=no-verify');
    });

    it('should keep an sslmode already present in the URI', () => {
      should(
        withDatastore({
          url: 'postgres://u:p@h:5432/d?sslmode=disable',
          ssl: true,
        })
      ).equal('postgres://u:p@h:5432/d?sslmode=disable');
    });

    it('should leave a full URI alone when the datastore has no ssl', () => {
      should(
        withDatastore({ url: 'postgres://u:p@h:5432/d', ssl: undefined })
      ).equal('postgres://u:p@h:5432/d');
    });

    it('should build the string from parts, with sslmode, for a bare hostname', () => {
      should(
        withDatastore({
          url: 'h.example.com',
          user: 'u',
          password: 'p@ss',
          port: 5432,
          database: 'd',
          ssl: true,
        })
      ).equal('postgres://u:p%40ss@h.example.com:5432/d?sslmode=verify-full');
    });
  });

  describe('processEntrance()', () => {
    it('should update entrance with region, county, city, iso_3166_2 from Nominatim', async () => {
      const entrance = {
        id: 1,
        latitude: 46.2,
        longitude: 2.2,
        isDeleted: false,
      };
      const address = {
        region: 'Auvergne-Rhône-Alpes',
        county: 'Puy-de-Dôme',
        city: 'Clermont-Ferrand',
        iso_3166_2: 'FR-ARA',
      };

      sinon.stub(TEntrance, 'findOne').resolves(entrance);
      sinon.stub(sails.services.geocodingservice, 'reverse').resolves(address);

      const updateSetStub = sinon
        .stub()
        .returns({ usingConnection: sinon.stub().resolves() });
      sinon.stub(TEntrance, 'update').returns({ set: updateSetStub });

      const sendNativeQueryStub = sinon
        .stub()
        .returns({ usingConnection: sinon.stub().resolves() });
      const fakeDb = {};
      sinon.stub(sails, 'getDatastore').returns({
        transaction: (fn) => fn(fakeDb),
        sendNativeQuery: sendNativeQueryStub,
      });

      await EnrichmentQueueService.processEntrance(1);

      should(sails.services.geocodingservice.reverse.calledOnce).be.true();
      should(sails.services.geocodingservice.reverse.firstCall.args).deepEqual([
        46.2, 2.2,
      ]);
      should(updateSetStub.calledOnce).be.true();
      should(updateSetStub.firstCall.args[0]).deepEqual({
        region: 'Auvergne-Rhône-Alpes',
        county: 'Puy-de-Dôme',
        city: 'Clermont-Ferrand',
        iso_3166_2: 'FR-ARA',
      });
    });

    it('should not update when entrance is deleted (isDeleted: true)', async () => {
      const entrance = {
        id: 1,
        latitude: 46.2,
        longitude: 2.2,
        isDeleted: true,
      };

      sinon.stub(TEntrance, 'findOne').resolves(entrance);
      const reverseStub = sinon.stub(
        sails.services.geocodingservice,
        'reverse'
      );

      await EnrichmentQueueService.processEntrance(1);

      should(reverseStub.called).be.false();
    });

    it('should not update when entrance is missing (findOne returns null)', async () => {
      sinon.stub(TEntrance, 'findOne').resolves(null);
      const reverseStub = sinon.stub(
        sails.services.geocodingservice,
        'reverse'
      );

      await EnrichmentQueueService.processEntrance(1);

      should(reverseStub.called).be.false();
    });

    it('should not update when Nominatim response is null', async () => {
      const entrance = {
        id: 1,
        latitude: 46.2,
        longitude: 2.2,
        isDeleted: false,
      };

      sinon.stub(TEntrance, 'findOne').resolves(entrance);
      sinon.stub(sails.services.geocodingservice, 'reverse').resolves(null);
      const updateStub = sinon.stub(TEntrance, 'update');

      await EnrichmentQueueService.processEntrance(1);

      should(updateStub.called).be.false();
    });
  });

  describe('processOrganization()', () => {
    it('should update org with iso_3166_2 only from Nominatim', async () => {
      const org = {
        id: 10,
        latitude: 48.8,
        longitude: 2.3,
        isDeleted: false,
      };
      const address = {
        region: 'Île-de-France',
        county: 'Paris',
        city: 'Paris',
        iso_3166_2: 'FR-IDF',
      };

      sinon.stub(TGrotto, 'findOne').resolves(org);
      sinon.stub(sails.services.geocodingservice, 'reverse').resolves(address);
      const updateStub = sinon.stub().resolves(org);
      sinon.stub(TGrotto, 'updateOne').returns({ set: updateStub });

      await EnrichmentQueueService.processOrganization(10);

      should(sails.services.geocodingservice.reverse.calledOnce).be.true();
      should(updateStub.calledOnce).be.true();
      should(updateStub.firstCall.args[0]).deepEqual({
        iso_3166_2: 'FR-IDF',
      });
    });

    it('should not call Nominatim when org has null coordinates', async () => {
      const org = {
        id: 10,
        latitude: null,
        longitude: null,
        isDeleted: false,
      };

      sinon.stub(TGrotto, 'findOne').resolves(org);
      const reverseStub = sinon.stub(
        sails.services.geocodingservice,
        'reverse'
      );

      await EnrichmentQueueService.processOrganization(10);

      should(reverseStub.called).be.false();
    });
  });

  describe('processJob()', () => {
    it('should rethrow error with statusCode 429', async () => {
      const err = new Error('Too Many Requests');
      err.statusCode = 429;

      sinon.stub(TEntrance, 'findOne').rejects(err);

      let thrown = false;
      try {
        await EnrichmentQueueService.processJob({
          id: 'job-1',
          data: { entityId: 1, entityType: 'entrance' },
        });
      } catch (e) {
        thrown = true;
        should(e.statusCode).equal(429);
      }
      should(thrown).be.true();
    });

    it('should rethrow error with code ECONNREFUSED', async () => {
      const err = new Error('Connection refused');
      err.code = 'ECONNREFUSED';

      sinon.stub(TEntrance, 'findOne').rejects(err);

      let thrown = false;
      try {
        await EnrichmentQueueService.processJob({
          id: 'job-2',
          data: { entityId: 1, entityType: 'entrance' },
        });
      } catch (e) {
        thrown = true;
        should(e.code).equal('ECONNREFUSED');
      }
      should(thrown).be.true();
    });

    it('should swallow other errors and log them', async () => {
      const err = new Error('Some permanent error');

      sinon.stub(TEntrance, 'findOne').rejects(err);
      const errorStub = sinon.stub(sails.log, 'error');

      await EnrichmentQueueService.processJob({
        id: 'job-3',
        data: { entityId: 1, entityType: 'entrance' },
      });

      should(errorStub.called).be.true();
    });
  });
});
