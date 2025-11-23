const should = require('should');
const DescriptionService = require('../../../api/services/DescriptionService');

describe('DescriptionService', () => {
  describe('setDocumentDescriptions()', () => {
    it('should set the document (and its parents) descriptions correctly', async () => {
      const document = await TDocument.findOne(2).populate('parent'); // Spelunca n°1 [ISSUE]
      await DescriptionService.setDocumentDescriptions(document);

      // Test Spelunca n°2 [ISSUE]
      should(document.descriptions.length).equal(1);
      should(document.descriptions[0].title).equal(
        "Un numéro qui mérite d'être nuancé"
      );

      // Test Spelunca [COLLECTION]
      should(document.parent.descriptions.length).equal(2);
      should(document.parent.descriptions.find((d) => d.id === 1).title).equal(
        'An awesome collection'
      );
      should(document.parent.descriptions.find((d) => d.id === 2).title).equal(
        'Une superbe collection'
      );
    });
    it('should do nothing and not throw an error if a document is not provided', async () => {
      await DescriptionService.setDocumentDescriptions(null);
    });

    it('should not set parent descriptions when setParent is false', async () => {
      const document = await TDocument.findOne(2).populate('parent');
      await DescriptionService.setDocumentDescriptions(document, false);
      should(document.descriptions.length).equal(1);
      should(document.parent.descriptions).be.undefined();
    });

    it('should handle document without parent', async () => {
      const document = await TDocument.findOne(1);
      await DescriptionService.setDocumentDescriptions(document);
      should(document.descriptions.length).equal(2);
    });
  });

  describe('getMassifDescriptions()', () => {
    it('should return empty array when massifId is null', async () => {
      const result = await DescriptionService.getMassifDescriptions(null);
      should(result).be.an.Array();
      should(result.length).equal(0);
    });

    it('should get descriptions for massif', async () => {
      const result = await DescriptionService.getMassifDescriptions(1);
      should(result).be.an.Array();
    });
  });

  describe('getCaveDescriptions()', () => {
    it('should return empty array when caveId is null', async () => {
      const result = await DescriptionService.getCaveDescriptions(null);
      should(result).be.an.Array();
      should(result.length).equal(0);
    });

    it('should get descriptions for cave', async () => {
      const result = await DescriptionService.getCaveDescriptions(1);
      should(result).be.an.Array();
    });
  });

  describe('getEntranceDescriptions()', () => {
    it('should return empty array when entranceId is null', async () => {
      const result = await DescriptionService.getEntranceDescriptions(null);
      should(result).be.an.Array();
      should(result.length).equal(0);
    });

    it('should get descriptions for entrance', async () => {
      const result = await DescriptionService.getEntranceDescriptions(1);
      should(result).be.an.Array();
    });
  });

  describe('getEntranceHDescriptions()', () => {
    it('should return empty array when entranceId is null', async () => {
      const result = await DescriptionService.getEntranceHDescriptions(null);
      should(result).be.an.Array();
      should(result.length).equal(0);
    });

    it('should get historical descriptions for entrance', async () => {
      const result = await DescriptionService.getEntranceHDescriptions(1);
      should(result).be.an.Array();
    });
  });

  describe('getDescription()', () => {
    it('should get a description by id', async () => {
      const result = await DescriptionService.getDescription(1);
      should.exist(result);
      should.exist(result.author);
    });
  });

  describe('getHDescription()', () => {
    it('should get historical descriptions by id', async () => {
      const result = await DescriptionService.getHDescription(1);
      should(result).be.an.Array();
    });
  });

  describe('getHDescriptionsOfDocument()', () => {
    it('should get historical descriptions of document', async () => {
      const result = await DescriptionService.getHDescriptionsOfDocument(1);
      should(result).be.an.Array();
    });
  });

  describe('compareDescriptionDate()', () => {
    it('should return true when document date is after new desc date', () => {
      const documentDate = new Date('2023-01-01T12:00:00');
      const newDescDate = new Date('2023-01-01T11:55:00');
      const oldDescDate = new Date('2023-01-01T11:00:00');
      const result = DescriptionService.compareDescriptionDate(
        documentDate,
        newDescDate,
        oldDescDate
      );
      should(result).be.true();
    });

    it('should return false when document date is before new desc date', () => {
      const documentDate = new Date('2023-01-01T11:00:00');
      const newDescDate = new Date('2023-01-01T12:00:00');
      const oldDescDate = new Date('2023-01-01T10:00:00');
      const result = DescriptionService.compareDescriptionDate(
        documentDate,
        newDescDate,
        oldDescDate
      );
      should(result).be.false();
    });

    it('should return false when new desc date is before old desc date', () => {
      const documentDate = new Date('2023-01-01T12:00:00');
      const newDescDate = new Date('2023-01-01T11:00:00');
      const oldDescDate = new Date('2023-01-01T11:30:00');
      const result = DescriptionService.compareDescriptionDate(
        documentDate,
        newDescDate,
        oldDescDate
      );
      should(result).be.false();
    });
  });
});
