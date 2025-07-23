const Fixted = require('fixted');

const fixted = new Fixted();
const fixtures = fixted.data;

describe('VCaverRoles', () => {
  describe('ORM -> find all', () => {
    it('should check find all function', async () => {
      const results = await sails.models.vcaverroles.find();
      results.length.should.be.equal(fixtures.vcaverroles.length);
    });
  });
});
