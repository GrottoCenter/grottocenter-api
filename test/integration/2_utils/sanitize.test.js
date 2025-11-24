const should = require('should');
const sanitize = require('../../../api/utils/sanitize');

describe('Sanitize utility', () => {
  it('should redact password fields', () => {
    const input = { username: 'john', password: 'secret123' };
    const result = sanitize(input);

    should(result.username).equal('john');
    should(result.password).equal('[REDACTED]');
  });

  it('should redact nested sensitive fields', () => {
    const input = { user: { name: 'john', apiKey: 'abc123' } };
    const result = sanitize(input);

    should(result.user.name).equal('john');
    should(result.user.apiKey).equal('[REDACTED]');
  });

  it('should handle arrays', () => {
    const input = { users: [{ name: 'john', token: 'xyz' }] };
    const result = sanitize(input);

    should(result.users[0].name).equal('john');
    should(result.users[0].token).equal('[REDACTED]');
  });

  it('should limit array size', () => {
    const input = { items: Array(20).fill({ id: 1 }) };
    const result = sanitize(input);

    should(result.items).have.length(10);
  });
});
