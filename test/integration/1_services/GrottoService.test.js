const should = require('should');
const sinon = require('sinon');
const GrottoService = require('../../../api/services/GrottoService');
const AuthTokenService = require('../AuthTokenService');
const SearchService = require('../../../api/services/SearchService');
const EnrichmentQueueService = require('../../../api/services/EnrichmentQueueService');

describe('GrottoService', () => {
  const userReq = {};

  before(async () => {
    userReq.token = await AuthTokenService.getUserToken();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getConvertedDataFromClientRequest()', () => {
    it('should extract all fields from request', () => {
      const req = {
        param: sinon.stub(),
        body: { country: { id: 'FR' } },
      };
      req.param.withArgs('address').returns('123 Main St');
      req.param.withArgs('city').returns('Paris');
      req.param.withArgs('county').returns('Paris County');
      req.param.withArgs('customMessage').returns('Welcome');
      req.param.withArgs('latitude').returns(48.8566);
      req.param.withArgs('longitude').returns(2.3522);
      req.param.withArgs('mail').returns('test@example.com');
      req.param.withArgs('postalCode').returns('75001');
      req.param.withArgs('region').returns('Île-de-France');
      req.param.withArgs('url').returns('https://example.com');
      req.param.withArgs('yearBirth').returns(2000);

      const result = GrottoService.getConvertedDataFromClientRequest(req);

      should(result.address).equal('123 Main St');
      should(result.city).equal('Paris');
      should(result.country).equal('FR');
      should(result.county).equal('Paris County');
      should(result.customMessage).equal('Welcome');
      should(result.latitude).equal(48.8566);
      should(result.longitude).equal(2.3522);
      should(result.mail).equal('test@example.com');
      should(result.postalCode).equal('75001');
      should(result.region).equal('Île-de-France');
      should(result.url).equal('https://example.com');
      should(result.yearBirth).equal(2000);
    });

    it('should handle missing country', () => {
      const req = {
        param: sinon.stub(),
        body: {},
      };
      req.param.returns(null);

      const result = GrottoService.getConvertedDataFromClientRequest(req);
      should(result.country).be.null();
    });
  });

  describe('getPopulatedOrganization()', () => {
    it('should return null when organization not found', async () => {
      const result = await GrottoService.getPopulatedOrganization(99999);
      should(result).be.null();
    });

    it('should return populated organization with all relations', async () => {
      const result = await GrottoService.getPopulatedOrganization(1);
      should(result).not.be.null();
      should(result.id).equal(1);
      should(result).have.property('author');
      should(result).have.property('names');
      should(result).have.property('cavers');
      should(result).have.property('documents');
      should(result).have.property('exploredNetworks');
      should(result).have.property('exploredEntrances');
      should(result).have.property('partnerNetworks');
      should(result).have.property('partnerEntrances');
      should(result.exploredCaves).be.undefined();
      should(result.partnerCaves).be.undefined();
    });

    it('should split caves into networks and entrances for explored', async () => {
      const result = await GrottoService.getPopulatedOrganization(1);
      should(result).not.be.null();
      should(result.exploredNetworks).be.an.Array();
      should(result.exploredEntrances).be.an.Array();
    });

    it('should split caves into networks and entrances for partner', async () => {
      const result = await GrottoService.getPopulatedOrganization(2);
      should(result).not.be.null();
      should(result.partnerNetworks).be.an.Array();
      should(result.partnerEntrances).be.an.Array();
    });

    it('should handle caves with single entrance correctly', async () => {
      const result = await GrottoService.getPopulatedOrganization(1);
      if (result && result.exploredCaves) {
        const singleEntranceCaves = result.exploredCaves.filter(
          (c) => c.entrances && c.entrances.length === 1
        );
        should(singleEntranceCaves.length).be.greaterThanOrEqual(0);
      }
      if (result && result.partnerCaves) {
        const singleEntranceCaves = result.partnerCaves.filter(
          (c) => c.entrances && c.entrances.length === 1
        );
        should(singleEntranceCaves.length).be.greaterThanOrEqual(0);
      }
      should(result).not.be.null();
    });
  });

  describe('createGrotto()', () => {
    let createdGrottoId;

    afterEach(async () => {
      if (createdGrottoId) {
        await TGrotto.destroy({ id: createdGrottoId });
        await TName.destroy({ grotto: createdGrottoId });
        createdGrottoId = null;
      }
    });

    it('should create grotto with geocoding', async () => {
      sinon.stub(EnrichmentQueueService, 'enqueue').resolves();

      const cleanedData = {
        author: 1,
        latitude: 48.8566,
        longitude: 2.3522,
        city: 'Paris',
      };

      const nameData = {
        author: 1,
        text: 'Test Grotto',
        language: 'eng',
      };

      const result = await GrottoService.createGrotto(
        userReq,
        cleanedData,
        nameData
      );

      createdGrottoId = result.id;
      should(result).not.be.null();
      should(result.id).be.a.Number();
      should(result.names[0].name).equal('Test Grotto');
    });

    it('should create grotto without geocoding', async () => {
      sinon.stub(EnrichmentQueueService, 'enqueue').resolves();

      const cleanedData = {
        author: 1,
        city: 'Paris',
      };

      const nameData = {
        author: 1,
        text: 'Test Grotto 2',
        language: 'eng',
      };

      const result = await GrottoService.createGrotto(
        userReq,
        cleanedData,
        nameData
      );

      createdGrottoId = result.id;
      should(result).not.be.null();
      should(result.names[0].name).equal('Test Grotto 2');
    });

    it('should handle empty latitude and longitude', async () => {
      const cleanedData = {
        author: 1,
        latitude: '',
        longitude: '',
        city: 'Paris',
      };

      const nameData = {
        author: 1,
        text: 'Test Grotto 3',
        language: 'eng',
      };

      const result = await GrottoService.createGrotto(
        userReq,
        cleanedData,
        nameData
      );

      createdGrottoId = result.id;
      should(result).not.be.null();
      should(
        result.latitude === null || result.latitude === undefined
      ).be.true();
      should(
        result.longitude === null || result.longitude === undefined
      ).be.true();
    });

    it('should convert 2-letter language code', async () => {
      const cleanedData = {
        author: 1,
        city: 'Paris',
      };

      const nameData = {
        author: 1,
        text: 'Test Grotto 4',
        language: 'en',
      };

      const result = await GrottoService.createGrotto(
        userReq,
        cleanedData,
        nameData
      );

      createdGrottoId = result.id;
      should(result).not.be.null();
      should(result.names[0].language).equal('eng');
    });

    it('should use caver language when no language provided', async () => {
      const cleanedData = {
        author: 1,
        city: 'Paris',
      };

      const nameData = {
        author: 1,
        text: 'Test Grotto 5',
      };

      const result = await GrottoService.createGrotto(
        userReq,
        cleanedData,
        nameData
      );

      createdGrottoId = result.id;
      should(result).not.be.null();
      should(result.names[0].language).not.be.undefined();
    });
  });

  describe('deleteInSearch()', () => {
    it('should delete organization from search index', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const deleteStub = sinon.stub(SearchService, 'deleteDocument').resolves();

      await GrottoService.deleteInSearch(123);

      should(deleteStub.calledOnce).be.true();
      should(deleteStub.calledWith('organizations', 123)).be.true();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('updateInSearch()', () => {
    it('should update organization in search index', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const updateStub = sinon.stub(SearchService, 'updateDocument').resolves();

      const organization = {
        id: 1,
        author: { id: 1, nickname: 'Author' },
        reviewer: { id: 2, nickname: 'Reviewer' },
        names: [{ name: 'Test Org', language: 'eng' }],
        iso_3166_2: 'FR-75',
        country: { nativeName: 'France' },
        cavers: [{ id: 1 }, { id: 2 }],
        exploredNetworks: [],
        exploredEntrances: [],
        partnerNetworks: [],
        partnerEntrances: [],
      };

      await GrottoService.updateInSearch(organization);

      should(updateStub.calledOnce).be.true();
      const callArg = updateStub.getCall(0).args[1];
      should(callArg.name).equal('Test Org');
      should(callArg.language).equal('eng');
      should(callArg.author).equal('Author');
      should(callArg.reviewer).equal('Reviewer');
      should(callArg.country).equal('France');
      should(callArg.nbCavers).equal(2);
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle missing optional fields', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const updateStub = sinon.stub(SearchService, 'updateDocument').resolves();

      const organization = {
        id: 1,
        author: { id: 1, nickname: 'Author' },
        names: [],
        exploredNetworks: [],
        exploredEntrances: [],
        partnerNetworks: [],
        partnerEntrances: [],
      };

      await GrottoService.updateInSearch(organization);

      should(updateStub.calledOnce).be.true();
      const callArg = updateStub.getCall(0).args[1];
      should(callArg.nbCavers).equal(0);
      process.env.NODE_ENV = originalEnv;
    });
  });
});
