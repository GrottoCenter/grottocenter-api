const should = require('should');
const DocumentService = require('../../../api/services/DocumentService');

const DOCUMENT_TYPE_PROPERTIES = [
  'id',
  'name',
  'comment',
  'isAvailable',
  'parent',
  'url',
];
const LICENSE_PROPERTIES = ['id', 'name', 'isCopyrighted', 'url'];

describe('DocumentService', () => {
  describe('getDocument()', () => {
    it('should set the document files, license, type and descriptions', async () => {
      const docId = 1;
      const populatedDoc = await DocumentService.getDocument(docId);
      should(populatedDoc.descriptions.length).equal(2);
      should(populatedDoc.files.length).equal(3);
      should(populatedDoc.license.id).equal(1);
      should(populatedDoc.license).have.properties(LICENSE_PROPERTIES);
      should(populatedDoc.type.id).equal(1);
      should(populatedDoc.type).have.properties(DOCUMENT_TYPE_PROPERTIES);
    });
  });
});
