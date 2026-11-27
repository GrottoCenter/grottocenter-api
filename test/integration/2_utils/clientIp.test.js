const should = require('should');

const { canonicalIp } = require('../../../api/utils/clientIp');

describe('clientIp.canonicalIp', () => {
  it('should strip the port from an IPv4 address', () => {
    canonicalIp('10.0.0.5:4321').should.equal('10.0.0.5');
  });

  it('should make equivalent IPv6 spellings equal', () => {
    canonicalIp('2001:0db8:0:0::1').should.equal('2001:db8::1');
    canonicalIp('[2001:DB8::1]:443').should.equal('2001:db8::1');
  });

  it('should keep distinct IPv6 addresses distinct', () => {
    canonicalIp('2001:db8::1').should.not.equal(canonicalIp('2001:db8::2'));
  });

  it('should turn IPv4-mapped addresses into IPv4, dotted or hex', () => {
    canonicalIp('::ffff:10.0.0.5').should.equal('10.0.0.5');
    canonicalIp('::ffff:a00:5').should.equal('10.0.0.5');
  });

  it('should return undefined for blank input and leave junk alone', () => {
    should(canonicalIp('  ')).be.undefined();
    should(canonicalIp(undefined)).be.undefined();
    canonicalIp('not:an:ip:[').should.equal('not:an:ip:[');
  });
});
