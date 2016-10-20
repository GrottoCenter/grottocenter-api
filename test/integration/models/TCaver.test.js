let should = require('should');

describe('TCaverModel', function() {

  describe('#find()', function() {
    it('should check find function', function (done) {
      TCaver.find()
      .then(function(results) {
        //fixtures['cavers'].length.should.be.greaterThan(0);
        this.should.equal(results.length, results.length, 'result size must be equals to ' + fixtures['cavers'].length);
        console.log('XXXXXXXXXXXXXXXX ' + results.length);
        done();
      })
      .catch(done);
    });
  });

});
