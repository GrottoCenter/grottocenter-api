/**
 * Codes of quantity kinds that require the substance field.
 */
const SUBSTANCE_REQUIRING_CODES = ['Concentration', 'IsotopeDelta'];

/**
 * Determines if a quantity kind code requires a substance.
 * @param {string} code - The quantity kind code
 * @returns {boolean}
 */
const isSubstanceRequired = (code) => SUBSTANCE_REQUIRING_CODES.includes(code);

/**
 * Validates substance field against the effective quantity kind.
 * Returns an error message string or null if valid.
 *
 * @param {string|null|undefined} substance - The substance value from the request
 * @param {string} quantityKindCode - The effective quantity kind code
 * @returns {string|null} Error message or null
 */
const validateSubstance = (substance, quantityKindCode) => {
  if (substance != null && substance.length > 100) {
    return 'The substance must not exceed 100 characters.';
  }
  if (isSubstanceRequired(quantityKindCode)) {
    if (substance == null || substance.trim().length === 0) {
      return 'Substance is required for Concentration or IsotopeDelta quantity kinds.';
    }
  } else if (substance != null) {
    return 'Substance is only valid for Concentration or IsotopeDelta quantity kinds.';
  }
  return null;
};

/**
 * Normalizes a substance value by trimming whitespace.
 * Returns null for null/undefined input.
 *
 * @param {string|null|undefined} substance
 * @returns {string|null}
 */
const normalizeSubstance = (substance) => {
  if (substance == null) return null;
  return substance.trim() || null;
};

module.exports = {
  SUBSTANCE_REQUIRING_CODES,
  isSubstanceRequired,
  normalizeSubstance,
  validateSubstance,

  /**
   * Get a sensor configuration by ID with populated associations.
   *
   * @param {number} configId
   * @returns {Promise<Object|null>} the populated configuration or null if not found
   */
  getPopulatedConfiguration: async (configId) => {
    const config = await TSensorConfiguration.findOne({ id: configId })
      .populate('author')
      .populate('reviewer')
      .populate('quantityKind')
      .populate('unit');
    return config || null;
  },
};
