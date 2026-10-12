require('should');
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

  describe('JSON serialization', () => {
    const PRIVATE_KEYS = [
      'login',
      'password',
      'activationCode',
      'mail',
      'pendingMail',
      'totpSecret',
      'lastUsedTotp',
      'lastUsedTotpAt',
      'totpFailedAttempts',
      'loginFailedAttempts',
      'lastFailedLoginAt',
      'lastSuspiciousEmailAt',
    ];

    it('should leave private attributes readable on the record', async () => {
      const caver = await TCaver.findOne({ login: 'admin1' });
      caver.login.should.equal('admin1');
      caver.password.should.startWith('$argon2id$');
      caver.mail.should.equal('admin1@admin1.com');
    });

    it('should drop private attributes from a found caver', async () => {
      const caver = await TCaver.findOne({ login: 'admin1' });
      const json = JSON.parse(JSON.stringify(caver));
      PRIVATE_KEYS.forEach((key) => json.should.not.have.property(key));
      json.should.have.properties({ id: 1, nickname: 'Admin1' });
    });

    it('should drop private attributes from a populated caver', async () => {
      // TDescription 1: author 1, reviewer 2.
      const description = await TDescription.findOne(1)
        .populate('author')
        .populate('reviewer');
      const json = JSON.parse(JSON.stringify(description));
      PRIVATE_KEYS.forEach((key) => json.author.should.not.have.property(key));
      PRIVATE_KEYS.forEach((key) =>
        json.reviewer.should.not.have.property(key)
      );
      json.author.nickname.should.equal('Admin1');
      json.reviewer.nickname.should.equal('Moderator1');
    });
  });
});
