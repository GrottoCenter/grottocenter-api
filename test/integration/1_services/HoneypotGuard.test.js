const should = require('should');
const HoneypotGuard = require('../../../api/services/HoneypotGuard');

describe('HoneypotGuard', () => {
  describe('check()', () => {
    it('should return trapped: false when website is absent from body', () => {
      const result = HoneypotGuard.check({ name: 'John' });
      should(result).deepEqual({ trapped: false });
    });

    it('should return trapped: false when body is undefined', () => {
      const result = HoneypotGuard.check(undefined);
      should(result).deepEqual({ trapped: false });
    });

    it('should return trapped: false when body is null', () => {
      const result = HoneypotGuard.check(null);
      should(result).deepEqual({ trapped: false });
    });

    it('should return trapped: false when website is empty string', () => {
      const result = HoneypotGuard.check({ website: '' });
      should(result).deepEqual({ trapped: false });
    });

    it('should return trapped: true with original value when field is populated', () => {
      const result = HoneypotGuard.check({ website: 'http://spam.com' });
      should(result).deepEqual({ trapped: true, value: 'http://spam.com' });
    });

    it('should return trapped: false when website is a single space', () => {
      const result = HoneypotGuard.check({ website: ' ' });
      should(result).deepEqual({ trapped: false });
    });

    it('should return trapped: false when website is a tab character', () => {
      const result = HoneypotGuard.check({ website: '\t' });
      should(result).deepEqual({ trapped: false });
    });

    it('should return trapped: false when website is mixed whitespace', () => {
      const result = HoneypotGuard.check({ website: ' \t \n \r ' });
      should(result).deepEqual({ trapped: false });
    });

    it('should return trapped: true preserving the original value including whitespace', () => {
      const result = HoneypotGuard.check({ website: '  bot  ' });
      should(result).deepEqual({ trapped: true, value: '  bot  ' });
    });

    it('should return trapped: true when website is an array (coerced to string)', () => {
      const result = HoneypotGuard.check({ website: ['spam'] });
      should(result.trapped).be.true();
      should(result.value).equal('spam');
    });

    it('should return trapped: true when website is a plain object (coerced to string)', () => {
      const result = HoneypotGuard.check({ website: { a: 1 } });
      should(result.trapped).be.true();
      should(result.value).equal('[object Object]');
    });

    it('should return trapped: false when website is null', () => {
      const result = HoneypotGuard.check({ website: null });
      should(result).deepEqual({ trapped: false });
    });

    it('should return trapped: false when website is undefined', () => {
      const result = HoneypotGuard.check({ website: undefined });
      should(result).deepEqual({ trapped: false });
    });
  });
});
