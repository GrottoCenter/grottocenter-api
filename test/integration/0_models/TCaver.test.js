const Fixted = require('fixted');

const fixted = new Fixted();
const fixtures = fixted.data;

describe('TCaverModel', () => {
  describe('ORM -> find all', () => {
    it('should check find all function', async () => {
      const results = await TCaver.find();
      results.length.should.be.equal(fixtures.tcaver.length);
    });
  });

  describe('ORM -> find by good login', () => {
    it('should check find function', async () => {
      const results = await TCaver.find({ login: 'admin1' });
      results.length.should.be.equal(1);
    });
  });

  describe('ORM -> find by bad login', () => {
    it('should check find function', async () => {
      const results = await TCaver.find({ login: 'bad_login' });
      results.length.should.be.equal(0);
    });
  });
});
