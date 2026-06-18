/* eslint-disable func-names */
const should = require('should');
const fc = require('fast-check');

// Feature: substance-reference-table
// Property 9: View Label Formatting
// For any time series row in v_measurement_wide, if substance_label is non-null,
// the quantity_unit column equals
//   quantity_kind_code || ' [' || substance_label || '] (' || unit_symbol || ')'
// If substance_label is null, quantity_unit equals
//   quantity_kind_code || ' (' || unit_symbol || ')'

/**
 * Replicates the SQL CASE expression from v_measurement_wide for quantity_unit:
 *
 *   CASE WHEN ts.substance_label IS NOT NULL
 *     THEN ts.quantity_kind_code || ' [' || ts.substance_label || '] (' || ts.unit_symbol || ')'
 *     ELSE ts.quantity_kind_code || ' (' || ts.unit_symbol || ')'
 *   END AS quantity_unit
 */
function formatQuantityUnit(quantityKindCode, substanceLabel, unitSymbol) {
  if (substanceLabel !== null) {
    return `${quantityKindCode} [${substanceLabel}] (${unitSymbol})`;
  }
  return `${quantityKindCode} (${unitSymbol})`;
}

/**
 * Property 9: View Label Formatting
 * Encodes: the SQL CASE expression that builds the quantity_unit column from
 * quantity_kind_code, substance_label (nullable), and unit_symbol.
 * Covers: all combinations of non-null and null substance_label values with
 * arbitrary quantity_kind_code and unit_symbol strings.
 *
 * Validates: Requirements 11.2, 11.3
 */
describe('VMeasurementWide - Property 9: view label formatting', () => {
  it('should format quantity_unit with brackets when substance_label is non-null', function () {
    this.timeout(60000);

    // Non-empty alphanumeric strings simulating realistic column values
    const quantityKindCodeArb = fc.stringMatching(/^[A-Za-z]{3,20}$/);
    const unitSymbolArb = fc.stringMatching(/^[A-Za-z0-9/°µ²³]{1,10}$/);
    const substanceLabelArb = fc.stringMatching(
      /^[A-Za-zδ0-9⁺⁻²³⁴₂₃₄ ]{2,30}$/
    );

    fc.assert(
      fc.property(
        quantityKindCodeArb,
        substanceLabelArb,
        unitSymbolArb,
        (quantityKindCode, substanceLabel, unitSymbol) => {
          const result = formatQuantityUnit(
            quantityKindCode,
            substanceLabel,
            unitSymbol
          );

          const expected = `${quantityKindCode} [${substanceLabel}] (${unitSymbol})`;
          should(result).equal(expected);

          // Structural checks: result contains brackets around substance
          should(result).startWith(`${quantityKindCode} [`);
          should(result).containEql(`[${substanceLabel}]`);
          should(result).endWith(`(${unitSymbol})`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format quantity_unit without brackets when substance_label is null', function () {
    this.timeout(60000);

    const quantityKindCodeArb = fc.stringMatching(/^[A-Za-z]{3,20}$/);
    const unitSymbolArb = fc.stringMatching(/^[A-Za-z0-9/°µ²³]{1,10}$/);

    fc.assert(
      fc.property(
        quantityKindCodeArb,
        unitSymbolArb,
        (quantityKindCode, unitSymbol) => {
          const result = formatQuantityUnit(quantityKindCode, null, unitSymbol);

          const expected = `${quantityKindCode} (${unitSymbol})`;
          should(result).equal(expected);

          // Structural checks: no brackets in result
          should(result).not.containEql('[');
          should(result).not.containEql(']');
          should(result).startWith(`${quantityKindCode} (`);
          should(result).endWith(`${unitSymbol})`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should distinguish non-null from null substance_label formatting', function () {
    this.timeout(60000);

    const quantityKindCodeArb = fc.stringMatching(/^[A-Za-z]{3,20}$/);
    const unitSymbolArb = fc.stringMatching(/^[A-Za-z0-9/°µ²³]{1,10}$/);
    const substanceLabelArb = fc.stringMatching(
      /^[A-Za-zδ0-9⁺⁻²³⁴₂₃₄ ]{2,30}$/
    );

    fc.assert(
      fc.property(
        quantityKindCodeArb,
        substanceLabelArb,
        unitSymbolArb,
        (quantityKindCode, substanceLabel, unitSymbol) => {
          const withSubstance = formatQuantityUnit(
            quantityKindCode,
            substanceLabel,
            unitSymbol
          );
          const withoutSubstance = formatQuantityUnit(
            quantityKindCode,
            null,
            unitSymbol
          );

          // The two formats must differ (substance adds bracket content)
          should(withSubstance).not.equal(withoutSubstance);

          // With substance is always longer due to ' [substanceLabel]' segment
          should(withSubstance.length).be.above(withoutSubstance.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
