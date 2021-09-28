let should = require('should');
const Fixted = require('fixted');
const fixted = new Fixted();
const fixtures = fixted.data;

describe('TCaverModel', function() {
  describe('ORM -> find all', function() {
    it('should check find all function', function(done) {
      TCaver.find()
        .then(function(results) {
          this.should.equal(
            results.length,
            fixtures.tcaver.length,
            'result size must be equals to ' + fixtures.tcaver.length,
          );
          done();
        })
        .catch((err) => done(err));
    });
  });

  describe('ORM -> find by good login', function() {
    it('should check find function', function(done) {
      TCaver.find({ login: 'test2' })
        .then(function(results) {
          results.length.should.be.equal(1);
          done();
        })
        .catch((err) => done(err));
    });
  });

  describe('ORM -> find by bad login', function() {
    it('should check find function', function(done) {
      TCaver.find({ login: 'bad_login' })
        .then(function(results) {
          results.length.should.be.equal(0);
          done();
        })
        .catch((err) => done(err));
    });
  });
});
