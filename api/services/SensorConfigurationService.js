const SubstanceService = require('./SubstanceService');

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
 * Validates idSubstance against the effective quantity kind code.
 * Verifies that the referenced substance exists via SubstanceService.findById.
 *
 * @param {number|null|undefined} idSubstance - The substance ID from the request
 * @param {string} quantityKindCode - The effective quantity kind code
 * @returns {Promise<{error: string|null, substance: Object|null}>}
 */
const validateSubstance = async (idSubstance, quantityKindCode) => {
  if (isSubstanceRequired(quantityKindCode)) {
    if (idSubstance == null) {
      return {
        error:
          'Substance is required for Concentration or IsotopeDelta quantity kinds.',
        substance: null,
      };
    }
  } else if (idSubstance != null) {
    return {
      error:
        'Substance is only valid for Concentration or IsotopeDelta quantity kinds.',
      substance: null,
    };
  }

  // If idSubstance is null and not required, valid with no substance
  if (idSubstance == null) {
    return { error: null, substance: null };
  }

  // Verify the referenced substance exists
  const substance = await SubstanceService.findById(idSubstance);
  if (!substance) {
    return {
      error: 'The referenced substance does not exist.',
      substance: null,
    };
  }

  return { error: null, substance };
};

module.exports = {
  SUBSTANCE_REQUIRING_CODES,
  isSubstanceRequired,
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
      .populate('unit')
      .populate('substance');
    if (!config) return null;

    // Waterline doesn't support nested populates, so manually resolve
    // the quantityKind's displayUnit FK to the full unit object.
    if (config.quantityKind && config.quantityKind.displayUnit) {
      const displayUnit = await TUnit.findOne({
        id: config.quantityKind.displayUnit,
      });
      if (displayUnit) {
        config.quantityKind.displayUnit = displayUnit;
      }
    }

    return config;
  },
};
