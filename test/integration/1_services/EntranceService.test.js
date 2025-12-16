const should = require('should');
const sinon = require('sinon');
const EntranceService = require('../../../api/services/EntranceService');
const AuthTokenService = require('../AuthTokenService');
const CommonService = require('../../../api/services/CommonService');
const SearchService = require('../../../api/services/SearchService');
const GeocodingService = require('../../../api/services/GeocodingService');

describe('EntranceService', () => {
  const userReq = {};
  const adminReq = {};

  before(async () => {
    userReq.token = await AuthTokenService.getUserToken();
    adminReq.token = await AuthTokenService.getAdminToken();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getConvertedNameFromClientRequest()', () => {
    it('should extract name data from request', () => {
      const req = {
        token: { id: 1 },
        param: sinon.stub().returns({
          text: 'Test Entrance',
          language: 'en',
        }),
      };
      const result = EntranceService.getConvertedNameFromClientRequest(req);
      should(result.name.author).equal(1);
      should(result.name.text).equal('Test Entrance');
      should(result.name.language).equal('en');
    });
  });

  describe('getConvertedDataFromClientRequest()', () => {
    it('should remove id from body', () => {
      const req = {
        body: { id: 123, name: 'Test', latitude: 45.5 },
        param: sinon.stub(),
      };
      req.param.withArgs('isSensitive').returns(undefined);
      const result = EntranceService.getConvertedDataFromClientRequest(req);
      should(result.id).be.undefined();
      should(result.name).equal('Test');
    });

    it('should handle isSensitive as string "true"', () => {
      const req = {
        body: {},
        param: sinon.stub(),
      };
      req.param.withArgs('isSensitive').returns('true');
      const result = EntranceService.getConvertedDataFromClientRequest(req);
      should(result.isSensitive).be.true();
    });

    it('should handle isSensitive as string "false"', () => {
      const req = {
        body: {},
        param: sinon.stub(),
      };
      req.param.withArgs('isSensitive').returns('false');
      const result = EntranceService.getConvertedDataFromClientRequest(req);
      should(result.isSensitive).be.false();
    });

    it('should handle isSensitive as boolean', () => {
      const req = {
        body: {},
        param: sinon.stub(),
      };
      req.param.withArgs('isSensitive').returns(true);
      const result = EntranceService.getConvertedDataFromClientRequest(req);
      should(result.isSensitive).be.true();
    });

    it('should set default geology', () => {
      const req = {
        body: {},
        param: sinon.stub(),
      };
      req.param.withArgs('isSensitive').returns(undefined);
      const result = EntranceService.getConvertedDataFromClientRequest(req);
      should(result.geology).equal('Q35758');
    });

    it('should keep provided geology', () => {
      const req = {
        body: { geology: 'Q12345' },
        param: sinon.stub(),
      };
      req.param.withArgs('isSensitive').returns(undefined);
      const result = EntranceService.getConvertedDataFromClientRequest(req);
      should(result.geology).equal('Q12345');
    });
  });

  describe('findRandom()', () => {
    it('should return null when no entrance found', async () => {
      sinon.stub(CommonService, 'query').resolves({ rows: [] });
      const result = await EntranceService.findRandom();
      should(result).be.null();
    });

    it('should return a random entrance with stats and timeInfo', async () => {
      const result = await EntranceService.findRandom();
      should(result).not.be.null();
      should(result.id).be.a.Number();
      should(result).have.property('stats');
      should(result).have.property('timeInfo');
    });
  });

  describe('deleteInSearch()', () => {
    it('should delete entrance from search index', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const deleteStub = sinon.stub(SearchService, 'deleteDocument').resolves();

      await EntranceService.deleteInSearch(123);

      should(deleteStub.calledOnce).be.true();
      should(deleteStub.calledWith('entrances', 123)).be.true();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('updateInSearch()', () => {
    it('should hide sensitive data for sensitive entrances', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const updateStub = sinon.stub(SearchService, 'updateDocument').resolves();

      const entrance = {
        id: 1,
        isSensitive: true,
        latitude: 45.5,
        longitude: 6.5,
        dateInscription: new Date(),
        author: { id: 1, nickname: 'Author' },
        names: [{ name: 'Test', language: 'en' }],
        iso_3166_2: 'FR-75',
        locations: [{ title: 'Loc', body: 'Body' }],
      };

      await EntranceService.updateInSearch(entrance);

      should(updateStub.calledOnce).be.true();
      const callArg = updateStub.getCall(0).args[1];
      should(callArg.latitude).be.null();
      should(callArg.longitude).be.null();
      should(callArg.locations).eql([]);
      process.env.NODE_ENV = originalEnv;
    });

    it('should keep coordinates for non-sensitive entrances', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const updateStub = sinon.stub(SearchService, 'updateDocument').resolves();

      const entrance = {
        id: 1,
        isSensitive: false,
        latitude: 45.5,
        longitude: 6.5,
        dateInscription: new Date(),
        author: { id: 1, nickname: 'Author' },
        names: [{ name: 'Test', language: 'en' }],
        iso_3166_2: 'FR-75',
      };

      await EntranceService.updateInSearch(entrance);

      should(updateStub.calledOnce).be.true();
      const callArg = updateStub.getCall(0).args[1];
      should(callArg.latitude).equal(45.5);
      should(callArg.longitude).equal(6.5);
      process.env.NODE_ENV = originalEnv;
    });

    it('should map cave data correctly', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const updateStub = sinon.stub(SearchService, 'updateDocument').resolves();

      const entrance = {
        id: 1,
        dateInscription: new Date(),
        author: { id: 1, nickname: 'Author' },
        names: [{ name: 'Test', language: 'en' }],
        iso_3166_2: 'FR-75',
        cave: {
          name: 'Cave Name',
          depth: 100,
          caveLength: 500,
          temperature: 10,
          isDiving: true,
        },
      };

      await EntranceService.updateInSearch(entrance);

      should(updateStub.calledOnce).be.true();
      const callArg = updateStub.getCall(0).args[1];
      should(callArg.cave).eql({
        name: 'Cave Name',
        depth: 100,
        length: 500,
        temperature: 10,
        isDiving: true,
      });
      process.env.NODE_ENV = originalEnv;
    });

    it('should trim geology field', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const updateStub = sinon.stub(SearchService, 'updateDocument').resolves();

      const entrance = {
        id: 1,
        dateInscription: new Date(),
        author: { id: 1, nickname: 'Author' },
        names: [{ name: 'Test', language: 'en' }],
        iso_3166_2: 'FR-75',
        geology: '  Q35758  ',
      };

      await EntranceService.updateInSearch(entrance);

      should(updateStub.calledOnce).be.true();
      const callArg = updateStub.getCall(0).args[1];
      should(callArg.geology).equal('Q35758');
      process.env.NODE_ENV = originalEnv;
    });

    it('should map all optional fields correctly', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const updateStub = sinon.stub(SearchService, 'updateDocument').resolves();

      const entrance = {
        id: 1,
        dateInscription: new Date(),
        author: { id: 1, nickname: 'Author' },
        reviewer: { id: 2, nickname: 'Reviewer' },
        names: [{ name: 'Test', language: 'en' }],
        iso_3166_2: 'FR-75',
        country: { nativeName: 'France' },
        descriptions: [{ title: 'Desc1', body: 'Body1' }],
        locations: [{ title: 'Loc1', body: 'LocBody1' }],
        riggings: [
          { title: 'Rig1', obstacles: 'obs', ropes: 'rope', anchors: 'anc' },
        ],
        histories: [{ body: 'History1' }],
        documents: [{ id: 1 }, { id: 2 }],
        comments: [
          {
            title: 'Com1',
            body: 'ComBody1',
            aestheticism: 5,
            caving: 4,
            approach: 3,
          },
        ],
      };

      await EntranceService.updateInSearch(entrance);

      should(updateStub.calledOnce).be.true();
      const callArg = updateStub.getCall(0).args[1];
      should(callArg.reviewer).equal('Reviewer');
      should(callArg.country).equal('France');
      should(callArg.descriptions).eql([{ title: 'Desc1', body: 'Body1' }]);
      should(callArg.locations).eql([{ title: 'Loc1', body: 'LocBody1' }]);
      should(callArg.riggings).eql([
        { title: 'Rig1', obstacles: 'obs', ropes: 'rope', anchors: 'anc' },
      ]);
      should(callArg.histories).eql([{ body: 'History1' }]);
      should(callArg.documents).eql([1, 2]);
      should(callArg.comments).eql([
        {
          title: 'Com1',
          body: 'ComBody1',
          aestheticism: 5,
          caving: 4,
          approach: 3,
        },
      ]);
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('getHEntrancesWithName()', () => {
    it('should return empty object when entrance does not exist', async () => {
      const result = await EntranceService.getHEntrancesWithName(
        99999,
        [],
        userReq.token
      );
      should(result).eql({});
    });

    it('should hide sensitive data for non-admin users', async () => {
      const hEntrances = await HEntrance.find({ t_id: 6 })
        .populate('author')
        .populate('reviewer')
        .populate('cave');

      const result = await EntranceService.getHEntrancesWithName(
        6,
        hEntrances,
        userReq.token
      );

      if (result.length > 0) {
        should(result[0].latitude).be.null();
        should(result[0].longitude).be.null();
        should(result[0].locations).eql([]);
      }
    });

    it('should show sensitive data for admin users', async () => {
      const hEntrances = await HEntrance.find({ t_id: 6 })
        .populate('author')
        .populate('reviewer')
        .populate('cave');

      const result = await EntranceService.getHEntrancesWithName(
        6,
        hEntrances,
        adminReq.token
      );

      if (result.length > 0) {
        should(result[0].latitude).not.be.null();
        should(result[0].longitude).not.be.null();
      }
    });
  });

  describe('getHEntrancesById()', () => {
    it('should handle network entrances', async () => {
      const result = await EntranceService.getHEntrancesById(
        1,
        'true',
        userReq.token
      );
      should(result).be.an.Array();
    });

    it('should handle non-network entrances', async () => {
      const result = await EntranceService.getHEntrancesById(
        1,
        'false',
        userReq.token
      );
      should(result).be.an.Array();
    });
  });

  describe('populateJSON()', () => {
    it('should populate entrance with null values', async () => {
      const entrance = { id: 1, author: null, cave: null, geology: null };
      const result = await EntranceService.populateJSON(entrance);
      should(result.author).be.null();
      should(result.cave).be.null();
      should(result.geology).be.null();
    });

    it('should populate entrance with all relations', async () => {
      const entrance = {
        id: 1,
        author: 1,
        cave: 1,
        names: [11],
        descriptions: [1],
        locations: [1],
        documents: [1],
        riggings: [1],
        comments: [1],
      };
      const result = await EntranceService.populateJSON(entrance);
      should(result.author).not.be.null();
      should(result.cave).not.be.null();
      should(result.names).be.an.Array();
      should(result.descriptions).be.an.Array();
      should(result.locations).be.an.Array();
      should(result.documents).be.an.Array();
      should(result.riggings).be.an.Array();
      should(result.comments).be.an.Array();
    });

    it('should handle empty arrays', async () => {
      const entrance = {
        id: 1,
        names: null,
        descriptions: null,
        locations: null,
        documents: null,
        riggings: null,
        comments: null,
      };
      const result = await EntranceService.populateJSON(entrance);
      should(result.names).eql([]);
      should(result.descriptions).eql([]);
      should(result.locations).eql([]);
      should(result.documents).eql([]);
      should(result.riggings).eql([]);
      should(result.comments).eql([]);
    });
  });

  describe('getPopulatedEntrance()', () => {
    it('should return null when entrance not found', async () => {
      const result = await EntranceService.getPopulatedEntrance(99999);
      should(result).be.null();
    });

    it('should return populated entrance with all relations', async () => {
      const result = await EntranceService.getPopulatedEntrance(1);
      should(result).not.be.null();
      should(result.id).equal(1);
      should(result).have.property('author');
      should(result).have.property('names');
      should(result).have.property('descriptions');
      should(result).have.property('locations');
      should(result).have.property('riggings');
      should(result).have.property('histories');
      should(result).have.property('comments');
      should(result).have.property('documents');
    });

    it('should populate cave with exploringOrganizations when cave exists', async () => {
      const result = await EntranceService.getPopulatedEntrance(1);
      if (result && result.cave) {
        should.exist(result.cave.exploringOrganizations);
        should(result.cave.exploringOrganizations).be.an.Array();
      }
    });
  });

  describe('createEntrance()', () => {
    let createdEntranceId;

    afterEach(async () => {
      if (createdEntranceId) {
        await TEntrance.destroy({ id: createdEntranceId });
        await TName.destroy({ entrance: createdEntranceId });
        createdEntranceId = null;
      }
    });

    it('should create entrance with name', async () => {
      sinon.stub(GeocodingService, 'reverse').resolves({
        region: 'Test Region',
        county: 'Test County',
        city: 'Test City',
        id_country: 'FR',
        iso_3166_2: 'FR-75',
      });

      const entranceData = {
        author: 1,
        latitude: 45.5,
        longitude: 6.5,
        cave: 1,
      };

      const nameDescLocData = {
        name: {
          author: 1,
          text: 'Test Entrance',
          language: 'eng',
        },
      };

      const result = await EntranceService.createEntrance(
        userReq,
        entranceData,
        nameDescLocData
      );

      createdEntranceId = result.id;
      should(result).not.be.null();
      should(result.id).be.a.Number();
      should(result.region).equal('Test Region');
      should(result.names[0].name).equal('Test Entrance');
    });

    it('should create entrance with description', async () => {
      sinon.stub(GeocodingService, 'reverse').resolves(null);

      const entranceData = {
        author: 1,
        latitude: 45.5,
        longitude: 6.5,
        cave: 1,
      };

      const nameDescLocData = {
        name: {
          author: 1,
          text: 'Test Entrance 2',
          language: 'eng',
        },
        description: {
          author: 1,
          body: 'Test description',
          language: 'eng',
          title: 'Test Title',
        },
      };

      const result = await EntranceService.createEntrance(
        userReq,
        entranceData,
        nameDescLocData
      );

      createdEntranceId = result.id;
      should(result).not.be.null();
      should(result.descriptions.length).be.greaterThan(0);
      await TDescription.destroy({ entrance: createdEntranceId });
    });

    it('should create entrance with location', async () => {
      sinon.stub(GeocodingService, 'reverse').resolves(null);

      const entranceData = {
        author: 1,
        latitude: 45.5,
        longitude: 6.5,
        cave: 1,
      };

      const nameDescLocData = {
        name: {
          author: 1,
          text: 'Test Entrance 3',
          language: 'eng',
        },
        location: {
          author: 1,
          body: 'Test location',
          language: 'eng',
        },
      };

      const result = await EntranceService.createEntrance(
        userReq,
        entranceData,
        nameDescLocData
      );

      createdEntranceId = result.id;
      should(result).not.be.null();
      should(result.locations.length).be.greaterThan(0);
      await TLocation.destroy({ entrance: createdEntranceId });
    });
  });
});
