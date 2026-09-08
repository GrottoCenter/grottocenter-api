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

    it('should trim whitespace from string fields', () => {
      const req = {
        param: sinon.stub(),
        body: { country: { id: 'FR' } },
      };
      req.param.withArgs('address').returns('  123 Main St  ');
      req.param.withArgs('city').returns('Paris ');
      req.param.withArgs('county').returns(' Paris County');
      req.param.withArgs('customMessage').returns('Welcome ');
      req.param.withArgs('latitude').returns(48.8566);
      req.param.withArgs('longitude').returns(2.3522);
      req.param.withArgs('mail').returns(' test@example.com ');
      req.param.withArgs('postalCode').returns('56220 ');
      req.param.withArgs('region').returns(' Île-de-France ');
      req.param.withArgs('url').returns(' https://example.com ');
      req.param.withArgs('yearBirth').returns(2000);

      const result = GrottoService.getConvertedDataFromClientRequest(req);

      should(result.address).equal('123 Main St');
      should(result.city).equal('Paris');
      should(result.county).equal('Paris County');
      should(result.customMessage).equal('Welcome');
      should(result.mail).equal('test@example.com');
      should(result.postalCode).equal('56220');
      should(result.region).equal('Île-de-France');
      should(result.url).equal('https://example.com');
    });

    it('should handle null string params without throwing', () => {
      const req = {
        param: sinon.stub(),
        body: {},
      };
      req.param.returns(null);

      const result = GrottoService.getConvertedDataFromClientRequest(req);
      should(result.postalCode).be.null();
      should(result.address).be.null();
      should(result.city).be.null();
    });

    it('should handle undefined string params without throwing', () => {
      const req = {
        param: sinon.stub(),
        body: {},
      };
      req.param.returns(undefined);

      const result = GrottoService.getConvertedDataFromClientRequest(req);
      should(result.postalCode).be.undefined();
      should(result.address).be.undefined();
      should(result.city).be.undefined();
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
      should(result).have.property('authoredDocuments');
      should(result).have.property('publishedDocuments');
      should(result).have.property('authoredCount');
      should(result).have.property('publishedCount');
      should(result).have.property('exploredNetworks');
      should(result).have.property('exploredEntrances');
      should(result).have.property('partnerNetworks');
      should(result).have.property('partnerEntrances');
      should(result.exploredCaves).be.undefined();
      should(result.partnerCaves).be.undefined();
      // Superseded by the two lists above; leaving it would double-render docs.
      should(result.documents).be.undefined();
    });

    it('should report authored and published documents separately', async () => {
      const result = await GrottoService.getPopulatedOrganization(1);
      should(result.authoredDocuments).be.an.Array();
      should(result.publishedDocuments).be.an.Array();
      should(result.authoredCount).be.a.Number();
      should(result.publishedCount).be.a.Number();

      // Each list is a preview page; the counts are the real totals, so they
      // can never be smaller than what the lists carry.
      should(result.authoredDocuments.length).be.lessThanOrEqual(10);
      should(result.publishedDocuments.length).be.lessThanOrEqual(10);
      should(result.authoredCount).be.greaterThanOrEqual(
        result.authoredDocuments.length
      );
      should(result.publishedCount).be.greaterThanOrEqual(
        result.publishedDocuments.length
      );
    });

    it('should hydrate documents with their citation fields', async () => {
      const result = await GrottoService.getPopulatedOrganization(1);
      should(result.authoredDocuments.length).be.greaterThan(0);
      // The organization page renders citations, so the lists must carry the
      // citation joins rather than bare titles.
      for (const document of result.authoredDocuments) {
        should(document).have.property('authors');
        should(document).have.property('authorsOrganization');
        should(document).have.property('type');
        should(document).have.property('parent');
      }
    });

    describe('ordering', () => {
      // The single-document fixture cannot show an ordering bug, so build a set
      // whose registration dates run counter to the id order.
      const createdDocIds = [];

      before(async () => {
        // Created one at a time on purpose: ids must ascend while the dates do
        // not, so returning rows in id order would fail the assertion below.
        /* eslint-disable no-await-in-loop */
        const dates = ['2019-01-01', '2023-01-01', '2021-01-01'];
        for (const date of dates) {
          const doc = await TDocument.create({
            author: 1,
            type: 1,
            editor: 1,
            dateInscription: new Date(date),
          }).fetch();
          createdDocIds.push(doc.id);
          await JDocumentGrottoAuthor.create({ document: doc.id, grotto: 1 });
        }
        /* eslint-enable no-await-in-loop */
      });

      after(async () => {
        await JDocumentGrottoAuthor.destroy({ document: createdDocIds });
        await TDocument.destroy({ id: createdDocIds });
      });

      it('should order both lists most recently registered first', async () => {
        const result = await GrottoService.getPopulatedOrganization(1);
        // getDocumentsForCitation re-queries by id, so without an explicit
        // re-sort the lists come back in whatever order postgres chooses.
        const isDescending = (documents) =>
          documents.every(
            (document, i) =>
              i === 0 ||
              new Date(documents[i - 1].dateInscription) >=
                new Date(document.dateInscription)
          );

        should(result.authoredDocuments.length).be.greaterThan(2);
        should(result.publishedDocuments.length).be.greaterThan(2);
        should(isDescending(result.authoredDocuments)).be.true();
        should(isDescending(result.publishedDocuments)).be.true();
      });
    });

    it('should exclude deleted documents from the authored list', async () => {
      const result = await GrottoService.getPopulatedOrganization(1);
      should(result.authoredDocuments.every((d) => !d.isDeleted)).be.true();
      should(result.publishedDocuments.every((d) => !d.isDeleted)).be.true();
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

    it('should not leak the document lists into the search payload', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const updateStub = sinon.stub(SearchService, 'updateDocument').resolves();

      // updateInSearch spreads the leftover fields into the Typesense payload,
      // so a display-only field that isn't destructured out would be indexed
      // against a schema that doesn't declare it.
      await GrottoService.updateInSearch({
        id: 1,
        author: { id: 1, nickname: 'Author' },
        names: [{ name: 'Test Org', language: 'eng' }],
        exploredNetworks: [],
        exploredEntrances: [],
        partnerNetworks: [],
        partnerEntrances: [],
        authoredDocuments: [{ id: 1 }],
        publishedDocuments: [{ id: 2 }],
        authoredCount: 1,
        publishedCount: 1,
      });

      const callArg = updateStub.getCall(0).args[1];
      should(callArg).not.have.property('authoredDocuments');
      should(callArg).not.have.property('publishedDocuments');
      should(callArg).not.have.property('authoredCount');
      should(callArg).not.have.property('publishedCount');
      should(callArg).not.have.property('documents');
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
