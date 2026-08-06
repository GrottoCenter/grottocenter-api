const should = require('should');
const sinon = require('sinon');
const DocumentService = require('../../../api/services/DocumentService');
const DescriptionService = require('../../../api/services/DescriptionService');
const AuthTokenService = require('../AuthTokenService');
const SearchService = require('../../../api/services/SearchService');

describe('DocumentService', () => {
  const userReq = {};

  before(async () => {
    userReq.token = await AuthTokenService.getUserToken();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('deleteInSearch()', () => {
    it('should delete document from search index', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const deleteStub = sinon.stub(SearchService, 'deleteDocument').resolves();

      await DocumentService.deleteInSearch(123);

      should(deleteStub.calledOnce).be.true();
      should(deleteStub.calledWith('documents', 123)).be.true();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('getDescriptionDataFromClient()', () => {
    it('should extract description data from titleAndDescriptionLanguage', () => {
      const body = {
        description: 'Test description',
        title: 'Test title',
        titleAndDescriptionLanguage: { id: 'eng' },
      };
      const result = DocumentService.getDescriptionDataFromClient(body, 1);
      should(result.author).equal(1);
      should(result.body).equal('Test description');
      should(result.title).equal('Test title');
      should(result.language).equal('eng');
    });

    it('should fall back to mainLanguage for backward compatibility', () => {
      const body = {
        description: 'Test description',
        title: 'Test title',
        mainLanguage: 'fra',
      };
      const result = DocumentService.getDescriptionDataFromClient(body, 1);
      should(result.language).equal('fra');
    });

    it('should prefer titleAndDescriptionLanguage over mainLanguage', () => {
      const body = {
        description: 'Test description',
        title: 'Test title',
        titleAndDescriptionLanguage: { id: 'eng' },
        mainLanguage: 'fra',
      };
      const result = DocumentService.getDescriptionDataFromClient(body, 1);
      should(result.language).equal('eng');
    });
  });

  describe('getChangedFileFromClient()', () => {
    it('should map file objects', () => {
      const files = [
        { id: 1, fileName: 'file1.pdf', otherData: 'ignored' },
        { id: 2, fileName: 'file2.pdf', otherData: 'ignored' },
      ];
      const result = DocumentService.getChangedFileFromClient(files);
      should(result).eql([
        { id: 1, fileName: 'file1.pdf' },
        { id: 2, fileName: 'file2.pdf' },
      ]);
    });
  });

  describe('getMainLanguage()', () => {
    it('should return undefined for null languages', () => {
      const result = DocumentService.getMainLanguage(null);
      should(result).be.undefined();
    });

    it('should return undefined for empty array', () => {
      const result = DocumentService.getMainLanguage([]);
      should(result).be.undefined();
    });

    it('should return single language', () => {
      const result = DocumentService.getMainLanguage([{ id: 'eng' }]);
      should(result).eql({ id: 'eng' });
    });

    it('should return main language from multiple', () => {
      const languages = [
        { id: 'eng', isMain: false },
        { id: 'fra', isMain: true },
      ];
      const result = DocumentService.getMainLanguage(languages);
      should(result).eql([{ id: 'fra', isMain: true }]);
    });
  });

  describe('getDocuments()', () => {
    it('should return empty array for empty input', async () => {
      const result = await DocumentService.getDocuments([]);
      should(result).eql([]);
    });

    it('should return documents with populated fields', async () => {
      const result = await DocumentService.getDocuments([1]);
      should(result).be.an.Array();
      if (result.length > 0) {
        should(result[0]).have.property('id');
        should(result[0]).have.property('descriptions');
        should(result[0]).have.property('type');
        should(result[0]).have.property('files');
      }
    });
  });

  describe('getPopulatedDocument()', () => {
    it('should return null when document not found', async () => {
      const result = await DocumentService.getPopulatedDocument(99999);
      should(result).be.null();
    });

    it('should return populated document', async () => {
      const result = await DocumentService.getPopulatedDocument(1);
      should(result).not.be.null();
      should(result.id).equal(1);
      should(result).have.property('author');
      should(result).have.property('descriptions');
      should(result).have.property('type');
    });
  });

  describe('getDocumentChildren()', () => {
    it('should return children documents', async () => {
      const result = await DocumentService.getDocumentChildren(1);
      should(result).be.an.Array();
    });
  });

  describe('getHDocumentById()', () => {
    it('should return historical documents', async () => {
      const result = await DocumentService.getHDocumentById(1);
      should(result).be.an.Array();
    });
  });

  describe('getIdDocumentByEntranceId()', () => {
    it('should return empty array for null entrance', async () => {
      const result = await DocumentService.getIdDocumentByEntranceId(null);
      should(result).eql([]);
    });

    it('should return document ids for entrance', async () => {
      const result = await DocumentService.getIdDocumentByEntranceId(1);
      should(result).be.an.Array();
    });
  });

  describe('getCollectionAncestors()', () => {
    it('should return empty array for empty input', async () => {
      const result = await DocumentService.getCollectionAncestors([]);
      should(result).eql([]);
    });

    it('should return collection ancestors', async () => {
      const result = await DocumentService.getCollectionAncestors([1]);
      should(result).be.an.Array();
    });
  });

  describe('getConvertedDataFromClient()', () => {
    it('should convert basic document data', async () => {
      const body = {
        identifier: 'ISBN-123',
        identifierType: { id: 1 },
        datePublication: '2024-01-01',
        issue: '5',
        pages: '10-20',
        license: { id: 1 },
        documentMainLanguage: { id: 'eng' },
      };
      const result = await DocumentService.getConvertedDataFromClient(body);
      should(result.identifier).equal('ISBN-123');
      should(result.identifierType).equal(1);
      should(result.datePublication).equal('2024-01-01');
      should(result.issue).equal('5');
      should(result.pages).equal('10-20');
      should(result.license).equal(1);
      should(result.languages).eql(['eng']);
    });

    it('should fall back to mainLanguage for backward compatibility', async () => {
      const body = {
        mainLanguage: 'fra',
      };
      const result = await DocumentService.getConvertedDataFromClient(body);
      should(result.languages).eql(['fra']);
    });

    it('should handle authors and organizations', async () => {
      const body = {
        authors: [{ id: 1 }, { id: 2 }],
        authorsOrganization: [{ id: 1 }],
        editor: { id: 1 },
        library: { id: 2 },
      };
      const result = await DocumentService.getConvertedDataFromClient(body);
      should(result.authors).eql([1, 2]);
      should(result.authorsOrganization).eql([1]);
      should(result.editor).equal(1);
      should(result.library).equal(2);
    });

    it('should map authorsOrganization ids from objects', async () => {
      const body = {
        authorsOrganization: [{ id: 1 }, { id: 2 }],
      };
      const result = await DocumentService.getConvertedDataFromClient(body);
      should(result.authorsOrganization).eql([1, 2]);
    });

    it('should handle subjects and iso3166', async () => {
      const body = {
        subjects: [{ id: 'S1' }, { code: 'S2' }],
        iso3166: [{ iso: 'FR' }, { iso: 'FR-75' }],
      };
      const result = await DocumentService.getConvertedDataFromClient(body);
      should(result.subjects).eql(['S1', 'S2']);
      should(result.countries).eql(['FR']);
      should(result.isoRegions).eql(['FR-75']);
    });

    it('should handle massifs including deprecated massif field', async () => {
      const body = {
        massif: { id: 1 },
        massifs: [2, 3],
      };
      const result = await DocumentService.getConvertedDataFromClient(body);
      should(result.massifs).eql([2, 3, 1]);
    });

    it('should handle parent and authorization document', async () => {
      const body = {
        parent: { id: 1 },
        authorizationDocument: { id: 2 },
      };
      const result = await DocumentService.getConvertedDataFromClient(body);
      should(result.parent).equal(1);
      should(result.authorizationDocument).equal(2);
    });

    it('should default license to 1', async () => {
      const body = {};
      const result = await DocumentService.getConvertedDataFromClient(body);
      should(result.license).equal(1);
    });

    it('should lookup option by name', async () => {
      const body = {
        option: 'Restricted',
      };
      const result = await DocumentService.getConvertedDataFromClient(body);
      if (result.option) {
        should(result.option).be.a.Number();
      }
    });

    it('should lookup type by name', async () => {
      const body = {
        type: 'Article',
      };
      const result = await DocumentService.getConvertedDataFromClient(body);
      if (result.type) {
        should(result.type).be.a.Number();
      }
    });

    it('should handle option and type as strings', async () => {
      const body = {
        option: 'Restricted',
        type: 'Collection',
      };
      const result = await DocumentService.getConvertedDataFromClient(body);
      should(result).have.property('option');
      should(result).have.property('type');
    });
  });

  describe('updateDocument()', () => {
    it('should update document with modified data', async () => {
      const updateData = {
        documentId: 1,
        reviewerId: 2,
        documentData: { title: 'Updated' },
        descriptionData: { body: 'New description' },
        newFiles: [],
        modifiedFiles: [],
        deletedFiles: [],
      };
      const result = await DocumentService.updateDocument(updateData);
      should(result).not.be.null();
      should(result.isValidated).be.false();
    });
  });

  describe('createDocument()', () => {
    let createdDocId;

    afterEach(async () => {
      if (createdDocId) {
        await TDocument.destroy({ id: createdDocId });
        await TDescription.destroy({ document: createdDocId });
        createdDocId = null;
      }
    });

    it('should create document with description', async () => {
      const documentData = {
        author: 1,
        type: 1,
      };
      const descriptionData = {
        author: 1,
        title: 'Test Document',
        body: 'Test description',
        language: 'eng',
      };

      const result = await DocumentService.createDocument(
        userReq,
        documentData,
        descriptionData
      );

      createdDocId = result.id;
      should(result).not.be.null();
      should(result.id).be.a.Number();
      should(result.descriptions.length).be.greaterThan(0);
    });

    it('should throw error for article without parent', async () => {
      const articleType = await TType.findOne({ name: 'Article' });
      if (!articleType) return;

      const documentData = {
        author: 1,
        type: articleType.id,
      };
      const descriptionData = {
        author: 1,
        title: 'Test Article',
        body: 'Test',
        language: 'eng',
      };

      try {
        await DocumentService.createDocument(
          userReq,
          documentData,
          descriptionData
        );
        should.fail('Should have thrown error');
      } catch (err) {
        should(err.message).match(/must provide a document parent/);
      }
    });

    it('should handle URL identifier type without download', async () => {
      const urlType = await TIdentifierType.findOne({ id: 'url' });
      if (!urlType) return;

      const documentData = {
        author: 1,
        type: 1,
        identifierType: urlType.id,
        identifier: 'https://example.com/doc.pdf',
      };
      const descriptionData = {
        author: 1,
        title: 'URL Document',
        body: 'Test',
        language: 'eng',
      };

      const result = await DocumentService.createDocument(
        userReq,
        documentData,
        descriptionData,
        false
      );

      createdDocId = result.id;
      should(result).not.be.null();
      should(result.identifier).equal('https://example.com/doc.pdf');
    });
  });

  describe('populateJSON()', () => {
    it('should populate document with null values', async () => {
      const documentData = {
        identifierType: null,
        author: null,
        authors: null,
        reviewer: null,
        editor: null,
        library: null,
        type: null,
        subjects: null,
        license: null,
        option: null,
        languages: null,
        countries: null,
        isoRegions: null,
        cave: null,
        entrance: null,
        massifs: null,
        parent: null,
        authorizationDocument: null,
      };
      const result = await DocumentService.populateJSON(1, documentData);
      should(result.identifierType).be.null();
      should(result.author).be.null();
      should(result.authors).eql([]);
    });

    it('should populate document with relations', async () => {
      const documentData = {
        author: 1,
        authors: [1],
        type: 1,
        languages: ['eng'],
        countries: ['FR'],
      };
      const result = await DocumentService.populateJSON(1, documentData);
      should(result.author).not.be.null();
      should(result.authors).be.an.Array();
      should(result.type).not.be.null();
      should(result.languages).be.an.Array();
      should(result.countries).be.an.Array();
    });
  });

  describe('updateInSearch()', () => {
    it('should update document in search index', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const updateStub = sinon.stub(SearchService, 'updateDocument').resolves();

      const document = {
        id: 1,
        author: { id: 1, nickname: 'Author' },
        reviewer: { id: 2, nickname: 'Reviewer' },
        validator: { id: 3, nickname: 'Validator' },
        identifierType: { id: 'isbn' },
        type: { name: 'Article' },
        license: { name: 'CC-BY' },
        descriptions: [{ title: 'Test', body: 'Description' }],
        authors: [{ nickname: 'Author1' }],
        subjects: [{ id: 'S1' }],
        countries: [{ id: 'FR', nativeName: 'France' }],
        isoRegions: [{ id: 'FR-75', name: 'Paris' }],
      };

      await DocumentService.updateInSearch(document);

      should(updateStub.calledOnce).be.true();
      const callArg = updateStub.getCall(0).args[1];
      should(callArg.creator).equal('Author');
      should(callArg.reviewer).equal('Reviewer');
      should(callArg.validator).equal('Validator');
      should(callArg.type).equal('Article');
      should(callArg.title).equal('Test');
      should(callArg.description).equal('Description');
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle parent document', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const updateStub = sinon.stub(SearchService, 'updateDocument').resolves();

      const document = {
        id: 1,
        author: { id: 1, nickname: 'Author' },
        parent: {
          type: { name: 'Collection' },
          descriptions: [{ title: 'Parent', body: 'Parent desc' }],
        },
      };

      await DocumentService.updateInSearch(document);

      should(updateStub.calledOnce).be.true();
      const callArg = updateStub.getCall(0).args[1];
      should(callArg.parent.type).equal('Collection');
      should(callArg.parent.title).equal('Parent');
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle editor and library', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const updateStub = sinon.stub(SearchService, 'updateDocument').resolves();

      const document = {
        id: 1,
        author: { id: 1, nickname: 'Author' },
        editor: { names: [{ name: 'Editor Org' }] },
        library: { names: [{ name: 'Library Org' }] },
      };

      await DocumentService.updateInSearch(document);

      should(updateStub.calledOnce).be.true();
      const callArg = updateStub.getCall(0).args[1];
      should(callArg.editor.name).equal('Editor Org');
      should(callArg.library.name).equal('Library Org');
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle cave, entrance, and massifs', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const updateStub = sinon.stub(SearchService, 'updateDocument').resolves();

      const document = {
        id: 1,
        author: { id: 1, nickname: 'Author' },
        cave: { names: [{ name: 'Test Cave' }] },
        entrance: { names: [{ name: 'Test Entrance' }] },
        massifs: [{ names: [{ name: 'Test Massif' }] }],
      };

      await DocumentService.updateInSearch(document);

      should(updateStub.calledOnce).be.true();
      const callArg = updateStub.getCall(0).args[1];
      should(callArg.cave.name).equal('Test Cave');
      should(callArg.entrance.name).equal('Test Entrance');
      should(callArg.massifs[0].name).equal('Test Massif');
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('populateFullDocumentSubEntities()', () => {
    it('should populate document with entrances', async () => {
      const document = await TDocument.findOne(5)
        .populate('languages')
        .populate('entrances')
        .populate('cave')
        .populate('massifs')
        .populate('library')
        .populate('editor')
        .populate('authorsOrganization');

      const result =
        await DocumentService.populateFullDocumentSubEntities(document);
      should(result).have.property('mainLanguage');
      if (result.entrances && result.entrances.length > 0) {
        should(result.entrances[0]).have.property('name');
      }
    });

    it('should populate document with cave', async () => {
      const document = await TDocument.findOne(6)
        .populate('languages')
        .populate('entrances')
        .populate('cave')
        .populate('massifs')
        .populate('library')
        .populate('editor')
        .populate('authorsOrganization');

      const result =
        await DocumentService.populateFullDocumentSubEntities(document);
      should(result).have.property('mainLanguage');
      if (result.cave) {
        should(result.cave).have.property('name');
      }
    });

    it('should populate document with parent', async () => {
      const document = await TDocument.findOne(1)
        .populate('languages')
        .populate('entrances')
        .populate('cave')
        .populate('massifs')
        .populate('library')
        .populate('editor')
        .populate('authorsOrganization');

      document.parent = 1;
      const result =
        await DocumentService.populateFullDocumentSubEntities(document);
      should(result).have.property('mainLanguage');
      should(result.parent).not.be.a.Number();
    });
  });

  describe('populateHDocumentsWithDescription()', () => {
    it('should return hDocuments when no descriptions found', async () => {
      sinon.stub(DescriptionService, 'getHDescriptionsOfDocument').resolves([]);

      const hDocuments = [{ id: '2024-01-01T00:00:00.000Z' }];
      const result = await DocumentService.populateHDocumentsWithDescription(
        1,
        hDocuments
      );

      should(result).eql(hDocuments);
    });

    it('should populate with first description when descriptions exist', async () => {
      const descriptions = [
        { id: '2024-01-01T00:00:00.000Z', title: 'First', body: 'First desc' },
      ];
      sinon
        .stub(DescriptionService, 'getHDescriptionsOfDocument')
        .resolves(descriptions);

      const hDocuments = [{ id: '2024-01-02T00:00:00.000Z' }];
      const result = await DocumentService.populateHDocumentsWithDescription(
        1,
        hDocuments
      );

      should(result[0].description).eql(descriptions[0]);
    });

    it('should update description based on date comparison', async () => {
      const descriptions = [
        { id: '2024-01-01T00:00:00.000Z', title: 'First', body: 'First desc' },
        {
          id: '2024-01-03T00:00:00.000Z',
          title: 'Second',
          body: 'Second desc',
        },
      ];
      sinon
        .stub(DescriptionService, 'getHDescriptionsOfDocument')
        .resolves(descriptions);
      const compareStub = sinon.stub(
        DescriptionService,
        'compareDescriptionDate'
      );
      compareStub.onFirstCall().returns(false);
      compareStub.onSecondCall().returns(true);

      const hDocuments = [{ id: '2024-01-04T00:00:00.000Z' }];
      const result = await DocumentService.populateHDocumentsWithDescription(
        1,
        hDocuments
      );

      should(result[0].description).eql(descriptions[1]);
    });

    it('should handle multiple historical documents', async () => {
      const descriptions = [
        { id: '2024-01-01T00:00:00.000Z', title: 'Desc1' },
        { id: '2024-01-02T00:00:00.000Z', title: 'Desc2' },
      ];
      sinon
        .stub(DescriptionService, 'getHDescriptionsOfDocument')
        .resolves(descriptions);
      sinon.stub(DescriptionService, 'compareDescriptionDate').returns(false);

      const hDocuments = [
        { id: '2024-01-03T00:00:00.000Z' },
        { id: '2024-01-04T00:00:00.000Z' },
      ];
      const result = await DocumentService.populateHDocumentsWithDescription(
        1,
        hDocuments
      );

      should(result).be.an.Array();
      should(result.length).equal(2);
      should(result[0].description.title).equal('Desc1');
      should(result[1].description.title).equal('Desc1');
    });
  });
});
