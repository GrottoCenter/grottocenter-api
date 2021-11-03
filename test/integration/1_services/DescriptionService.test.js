let should = require('should');

describe('DescriptionService', () => {
  describe('setDocumentDescriptions()', () => {
    it('should set the document (and its parents) descriptions correctly', async () => {
      const document = await TDocument.findOne(2).populate('parent'); // Spelunca n°1 [ISSUE]
      await DescriptionService.setDocumentDescriptions(document);

      // Test Spelunca n°2 [ISSUE]
      should(document.descriptions.length).equal(1);
      should(document.descriptions[0].title).equal(
        "Un numéro qui mérite d'être nuancé",
      );

      // Test Spelunca [COLLECTION]
      should(document.parent.descriptions.length).equal(2);
      should(document.parent.descriptions[0].title).equal(
        'An awesome collection',
      );
      should(document.parent.descriptions[1].title).equal(
        'Une superbe collection',
      );
    });
  });
});
