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

  describe('ORM -> pendingMail', () => {
    it('should allow setting pendingMail', async () => {
      const caver = await TCaver.create({
        nickname: 'testpending',
        mail: 'test@example.com',
        pendingMail: 'new@example.com',
        language: 'fra',
        dateInscription: new Date(),
      }).fetch();
      caver.pendingMail.should.be.equal('new@example.com');
      // clean up
      await TCaver.destroyOne({ id: caver.id });
    });

    it('should fail if pendingMail is not a valid email', async () => {
      try {
        await TCaver.create({
          nickname: 'testpendingfail',
          mail: 'test2@example.com',
          pendingMail: 'not-an-email',
          language: 'fra',
          dateInscription: new Date(),
        });
        throw new Error('Should have failed');
      } catch (err) {
        err.name.should.be.equal('UsageError');
      }
    });
  });
});
