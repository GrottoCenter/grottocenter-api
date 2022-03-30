const should = require('should');

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
  describe('setDocumentFiles()', () => {
    it('should set the document files', async () => {
      const doc = { id: 1 };
      await DocumentService.setDocumentFiles(doc);
      should(doc.files.length).equal(3);
    });
  });
  describe('setDocumentLicense()', () => {
    it('should set the document license', async () => {
      const doc = { id: 1, license: 1 };
      await DocumentService.setDocumentLicense(doc);
      should(doc.license.id).equal(1);
      should(doc.license).have.properties(LICENSE_PROPERTIES);
    });
  });
  describe('setDocumentType()', () => {
    it('should set the document type', async () => {
      const doc = { id: 1, type: 1 };
      await DocumentService.setDocumentType(doc);
      should(doc.type.id).equal(1);
      should(doc.type).have.properties(DOCUMENT_TYPE_PROPERTIES);
    });
  });
});
