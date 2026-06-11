/**
 * SIConverter service for the scientific data import pipeline.
 *
 * Converts measurement values from the sensor's display unit to SI units
 * using the formula: value_si = (value - siToDisplayOffset) / siToDisplayFactor
 *
 * Supports locale-aware number parsing:
 *   - French locale ("fr"): commas are decimal separators → replace before parseFloat
 *   - English locale (default): dots are decimal separators → parseFloat directly
 *
 * This is a pure synchronous function — no DB access, no side effects.
 */

/**
 * Converts a single display-unit value to SI units.
 *
 * @param {number} value - Raw measurement value in display unit
 * @param {Object} quantityKind - { siToDisplayFactor, siToDisplayOffset }
 * @returns {number} value in SI units
 * @throws {Error} if siToDisplayFactor is zero
 */
const toSI = (value, quantityKind) => {
  // Coerce to Number because Waterline returns numeric columns as strings
  // when the model declares type: 'string' with columnType: 'numeric'.
  const factor = Number(quantityKind.siToDisplayFactor);
  const offset = Number(quantityKind.siToDisplayOffset);

  // 3.9. Factor validity check: catch zero, NaN (from null/undefined), and ±Infinity
  if (!factor || !Number.isFinite(factor)) {
    throw new Error(
      `Invalid SI conversion: siToDisplayFactor is not a valid finite number (got ${quantityKind.siToDisplayFactor}).`
    );
  }

  // Offset validity check: NaN or Infinity would corrupt all calculations
  if (!Number.isFinite(offset)) {
    throw new Error(
      `Invalid SI conversion: siToDisplayOffset is not a valid finite number (got ${quantityKind.siToDisplayOffset}).`
    );
  }

  // 3.8. Formula: value_si = (value - siToDisplayOffset) / siToDisplayFactor
  return (value - offset) / factor;
};

/**
 * Parses a raw string value according to the profile's number locale.
 *
 * @param {string} rawString - Raw string value from the parsed row
 * @param {string|undefined} numberLocale - 'fr' or undefined/'en'
 * @returns {number} Parsed float value
 * @throws {Error} if the parsed value is NaN
 */
const parseLocaleNumber = (rawString, numberLocale) => {
  // 3.10. Locale-aware number parsing
  let value;
  if (numberLocale === 'fr') {
    // French locale: commas are decimal separators → replace ALL commas with dots.
    // This handles the case where a single comma is the decimal separator.
    // Note: French convention uses spaces (not commas) for thousands grouping,
    // so multiple commas in a value indicate malformed data rather than grouping.
    value = parseFloat(rawString.replace(/,/g, '.'));
  } else {
    // English locale (default): dots are decimal separators
    value = parseFloat(rawString);
  }

  if (Number.isNaN(value)) {
    const truncated =
      rawString.length > 50 ? `${rawString.slice(0, 50)}…` : rawString;
    throw new Error(
      `Cannot parse '${truncated}' as a number (locale: ${numberLocale || 'en'}).`
    );
  }

  return value;
};

/**
 * Converts all measurement values in parsed rows to SI units.
 *
 * @param {string[][]} rows - Parsed rows (string values)
 * @param {Map<number, {quantityKind: {siToDisplayFactor, siToDisplayOffset}}>} sensorConfigMap
 *   Map of columnIndex → sensorConfig
 * @param {number[]} columnIndices - Original column indices in rows
 *   (after excluded-column filtering). Used to map columnIndex → row position.
 * @param {Object} profile - Profile (for numberLocale)
 * @returns {Array<{columnIndex: number, value: number, valueSi: number}[]>}
 *   Per-row measurement arrays
 * @throws {Error} if siToDisplayFactor is zero for any quantity kind
 */
const convertAll = (rows, sensorConfigMap, columnIndices, profile) => {
  const { numberLocale } = profile || {};

  // Pre-compute positions for all measurement columns present in sensorConfigMap
  // Fail if any measurement column is not found in columnIndices (indicates a
  // columnIndex that was excluded or exceeds the file width).
  const measurementColumns = [];
  for (const [colIndex, sensorConfig] of sensorConfigMap.entries()) {
    const pos = columnIndices.indexOf(colIndex);
    if (pos === -1) {
      throw new Error(
        `Measurement column index ${colIndex} not found in parsed data. ` +
          'It may have been excluded or exceed the file width.'
      );
    }
    measurementColumns.push({ colIndex, pos, sensorConfig });
  }

  return rows.map((row, rowIdx) =>
    measurementColumns.map(({ colIndex, pos, sensorConfig }) => {
      const rawString = row[pos];
      let value;
      try {
        value = parseLocaleNumber(rawString, numberLocale);
      } catch (err) {
        throw new Error(
          `Measurement conversion failed at row ${rowIdx + 1}, column index ${colIndex}: ${err.message}`
        );
      }
      const valueSi = toSI(value, sensorConfig.quantityKind);

      return { columnIndex: colIndex, value, valueSi };
    })
  );
};

module.exports = { toSI, convertAll, parseLocaleNumber };
