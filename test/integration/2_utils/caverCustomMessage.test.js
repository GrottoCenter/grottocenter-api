const should = require('should');
const {
  CAVER_CUSTOM_MESSAGE_MAX_LENGTH,
  normalizeCaverCustomMessage,
} = require('../../../api/utils/caverCustomMessage');

describe('caverCustomMessage', () => {
  it('trims the message', () => {
    should(normalizeCaverCustomMessage('  Cave diver  ')).deepEqual({
      value: 'Cave diver',
    });
  });

  it('clears the field with an empty or blank message', () => {
    should(normalizeCaverCustomMessage('')).deepEqual({ value: null });
    should(normalizeCaverCustomMessage(' \n ')).deepEqual({ value: null });
  });

  it('clears the field with null', () => {
    should(normalizeCaverCustomMessage(null)).deepEqual({ value: null });
  });

  it('keeps line breaks and normalizes them to \\n', () => {
    should(normalizeCaverCustomMessage('a\r\nb\rc\nd')).deepEqual({
      value: 'a\nb\nc\nd',
    });
  });

  it('removes control characters other than tab and line feed', () => {
    should(normalizeCaverCustomMessage('a\u0000b\u0007c\td\u007F')).deepEqual({
      value: 'abc\td',
    });
  });

  it('rejects a value that is not a string', () => {
    should(normalizeCaverCustomMessage(42)).have.property('error');
    should(normalizeCaverCustomMessage({ text: 'a' })).have.property('error');
  });

  it('accepts a message of the maximum length', () => {
    const message = 'x'.repeat(CAVER_CUSTOM_MESSAGE_MAX_LENGTH);
    should(normalizeCaverCustomMessage(message)).deepEqual({ value: message });
  });

  it('rejects a message over the maximum length', () => {
    const message = 'x'.repeat(CAVER_CUSTOM_MESSAGE_MAX_LENGTH + 1);
    should(normalizeCaverCustomMessage(message).error).match(/500/);
  });

  it('checks the length once the message is trimmed', () => {
    const message = ` ${'x'.repeat(CAVER_CUSTOM_MESSAGE_MAX_LENGTH)} `;
    should(normalizeCaverCustomMessage(message)).deepEqual({
      value: 'x'.repeat(CAVER_CUSTOM_MESSAGE_MAX_LENGTH),
    });
  });
});
