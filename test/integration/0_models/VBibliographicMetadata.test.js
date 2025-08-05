const Fixted = require('fixted');

const fixted = new Fixted();
const fixtures = fixted.data;

describe('VBibliographicMetadata', () => {
  describe('ORM -> find all', () => {
    it('should check find all function', async () => {
      const results = await sails.models.vbibliographicmetadata.find();
      results.length.should.be.equal(fixtures.vbibliographicmetadata.length);
    });
  });

  describe('ORM -> find one by id', () => {
    it('should retrieve a specific document by id', async () => {
      const target = fixtures.vbibliographicmetadata[0];
      const result = await sails.models.vbibliographicmetadata.findOne({
        id: target.id,
      });
      result.should.be.an.Object();
      result.oaiIdentifier.should.equal(target.oaiIdentifier);
    });
  });

  describe('Fields and types', () => {
    it('should have expected fields and types for each document', async () => {
      const results = await sails.models.vbibliographicmetadata.find();
      results.forEach((doc) => {
        doc.should.have.property('id').which.is.a.Number();
        doc.should.have.property('oaiIdentifier').which.is.a.String();
        doc.should.have.property('listSets').which.is.an.Array();
        doc.should.have
          .property('metadataStatus')
          .which.is.oneOf(['registered', 'deleted']);
        doc.should.have.property('dcTypeDcmi').which.is.a.String();
      });
    });
  });

  describe('Relations and children integrity', () => {
    it('should correctly link child documents to parents via dcRelations', async () => {
      const results = await sails.models.vbibliographicmetadata.find();
      const byId = Object.fromEntries(results.map((doc) => [doc.id, doc]));

      results.forEach((doc) => {
        if (doc.dcRelations) {
          doc.dcRelations.forEach((rel) => {
            const parentId = parseInt(rel.split(':').pop(), 10);
            if (byId[parentId]) {
              byId[parentId].children.should.containEql(doc.id);
            }
          });
        }
      });
    });
  });
});
