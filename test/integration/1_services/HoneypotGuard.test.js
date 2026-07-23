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
  });
});
