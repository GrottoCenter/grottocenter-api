const should = require('should');
const Fixted = require('fixted');

const fixted = new Fixted();
const fixtures = fixted.data;

describe('TCaverModel', () => {
  describe('ORM -> find all', () => {
    it('should check find all function', (done) => {
      TCaver.find()
        .then(function (results) {
          this.should.equal(
            results.length,
            fixtures.tcaver.length,
            `result size must be equals to ${fixtures.tcaver.length}`,
          );
          done();
        })
        .catch((err) => done(err));
    });
  });

  describe('ORM -> find by good login', () => {
    it('should check find function', (done) => {
      TCaver.find({ login: 'admin1' })
        .then((results) => {
          results.length.should.be.equal(1);
          done();
        })
        .catch((err) => done(err));
    });
  });

  describe('ORM -> find by bad login', () => {
    it('should check find function', (done) => {
      TCaver.find({ login: 'bad_login' })
        .then((results) => {
          results.length.should.be.equal(0);
          done();
        })
        .catch((err) => done(err));
    });
  });
});
