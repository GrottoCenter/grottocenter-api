const { validateStringLength } = require('./stringLengthValidation');

const POSTAL_CODE_MAX_LENGTH = 10; // TGrotto.postalCode maxLength

/**
 * Validates that a postal code does not exceed the DB column limit.
 * Returns an error message if invalid, or null if valid.
 *
 * @param {string} postalCode - The postal code to validate
 * @returns {string|null} Error message or null
 */
const validatePostalCodeLength = (postalCode) => {
  const error = validateStringLength(
    'Postal code',
    postalCode,
    POSTAL_CODE_MAX_LENGTH
  );
  return error ? error.message : null;
};

module.exports = { POSTAL_CODE_MAX_LENGTH, validatePostalCodeLength };
