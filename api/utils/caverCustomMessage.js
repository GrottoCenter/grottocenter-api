const { validateStringLength } = require('./stringLengthValidation');

const CAVER_CUSTOM_MESSAGE_MAX_LENGTH = 500; // TCaver.customMessage maxLength

// C0 control characters and DEL, except tab and line feed
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B-\u001F\u007F]/g;

/**
 * Normalize the custom message a caver sets on their profile (#1730).
 * Line breaks are kept (normalized to \n), other control characters are
 * removed, the result is trimmed and an empty message clears the field.
 * The length is checked on the normalized value.
 *
 * @param {*} value - The value received in the request body
 * @returns {{ value?: string|null, error?: string }}
 */
const normalizeCaverCustomMessage = (value) => {
  if (value === null) return { value: null };
  if (typeof value !== 'string') {
    return { error: 'The custom message must be a string.' };
  }
  const normalized = value
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_CHARACTERS, '')
    .trim();
  const lengthError = validateStringLength(
    'Custom message',
    normalized,
    CAVER_CUSTOM_MESSAGE_MAX_LENGTH
  );
  if (lengthError) return { error: lengthError.message };
  return { value: normalized === '' ? null : normalized };
};

module.exports = {
  CAVER_CUSTOM_MESSAGE_MAX_LENGTH,
  normalizeCaverCustomMessage,
};
