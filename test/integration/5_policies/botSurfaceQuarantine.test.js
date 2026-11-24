const should = require('should');

describe('bot-surface quarantine policy', () => {
  it('requires a token, and the controller checks the role', () => {
    should([sails.config.policies['v1/bot-surface/quarantine']].flat()).eql([
      'tokenAuth',
    ]);
  });
});
