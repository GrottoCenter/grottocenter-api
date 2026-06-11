/* eslint-disable func-names */
/**
 * Property-based tests for the CSV Parser service.
 *
 * Uses fast-check to verify correctness properties that must hold across all
 * valid inputs, not just the specific examples in the unit test file.
 *
 * The Parser is a pure synchronous function — no DB access, no stubs needed.
 */
const should = require('should');
const fc = require('fast-check');
const Parser = require('../../../../api/services/observation-import/Parser');

// ---------------------------------------------------------------------------
// Shared arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a safe CSV cell value: printable ASCII, no double-quotes,
 * no commas, no semicolons, no tabs, no newlines (those are delimiters/special).
 * Allows empty strings.
 */
const safeCellArb = fc.stringMatching(/^[^",;\t\r\n]{0,20}$/);

/**
 * Generates a matrix (2D array) of safe cell strings.
 *
 * @param {number} minRows
 * @param {number} maxRows
 * @param {number} numCols
 */
const matrixArb = (minRows, maxRows, numCols) =>
  fc.array(fc.array(safeCellArb, { minLength: numCols, maxLength: numCols }), {
    minLength: minRows,
    maxLength: maxRows,
  });

/**
 * Serializes a matrix of string cells into a CSV string using the given delimiter.
 */
const matrixToCsv = (matrix, delimiter) =>
  `${matrix.map((row) => row.join(delimiter)).join('\n')}\n`;

// ---------------------------------------------------------------------------
// Property 3: Row filtering preserves correct data rows
//
// For any file with T total rows, headerRow H (1-based), and skipLastRows S,
// the parser SHALL output exactly T - H - S data rows, with columns marked
// excluded removed from each row.
//
// Validates: Requirements 3.2, 3.3, 3.7
// ---------------------------------------------------------------------------

/**
 * Property 3: Row filtering preserves correct data rows
 * Validates: Requirements 3.2, 3.3, 3.7
 */
describe('Parser - Property 3: Row filtering preserves correct data rows', () => {
  it('should output exactly T - H - S data rows for any valid T, H, S combination', function () {
    this.timeout(30000);

    fc.assert(
      fc.property(
        // numCols, T (total rows), then H and S derived via chain
        fc.integer({ min: 2, max: 5 }), // numCols
        fc
          .integer({ min: 3, max: 20 }) // T: total rows
          .chain((T) =>
            fc
              .integer({ min: 1, max: T - 1 }) // H: headerRow (1-based)
              .chain((H) => {
                const dataRowCount = T - H;
                return fc
                  .integer({ min: 0, max: dataRowCount - 1 }) // S: skipLastRows
                  .map((S) => ({ T, H, S, dataRowCount }));
              })
          ),
        (numCols, { T, H, S, dataRowCount }) => {
          // Build matrix: H rows before+including header, then dataRowCount data rows
          const preHeaderRows =
            H > 1 ? fc.sample(matrixArb(H - 1, H - 1, numCols), 1)[0] : [];
          const headerRow = fc.sample(
            fc.array(safeCellArb, { minLength: numCols, maxLength: numCols }),
            1
          )[0];
          const dataRows = fc.sample(
            matrixArb(dataRowCount, dataRowCount, numCols),
            1
          )[0];

          const allRows = [...preHeaderRows, headerRow, ...dataRows];
          const csvText = matrixToCsv(allRows, ',');
          const buf = Buffer.from(csvText, 'utf8');

          const profile = {
            headerRow: H,
            skipLastRows: S,
            columnMappings: Array.from({ length: numCols }, (_, i) => ({
              columnIndex: i,
              role: i === 0 ? 'timestamp' : 'measurement',
              timestampType: i === 0 ? 'datetime' : undefined,
              sensorConfigurationId: i === 0 ? undefined : i,
            })),
          };

          // Expected number of data rows
          const expectedRows = dataRowCount - S;

          const result = Parser.parse(buf, profile);

          should(result.rows.length).equal(
            expectedRows,
            `Expected ${expectedRows} rows (T=${T}, H=${H}, S=${S}, dataRowCount=${dataRowCount}), got ${result.rows.length}.\nCSV:\n${csvText}`
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should remove only excluded columns from every row', function () {
    this.timeout(30000);

    fc.assert(
      fc.property(
        fc
          .integer({ min: 3, max: 6 }) // numCols
          .chain((numCols) => {
            const maxExcluded = numCols - 2;
            return fc
              .tuple(
                fc.constant(numCols),
                fc.integer({ min: 1, max: 10 }), // numDataRows
                fc.uniqueArray(fc.integer({ min: 2, max: numCols - 1 }), {
                  maxLength: maxExcluded,
                })
              )
              .chain(([cols, numDataRows, excludedIndicesArr]) =>
                matrixArb(numDataRows, numDataRows, cols).map((dataRows) => ({
                  numCols: cols,
                  numDataRows,
                  excludedIndicesArr,
                  dataRows,
                }))
              );
          }),
        ({ numCols, excludedIndicesArr, dataRows }) => {
          const excludedSet = new Set(excludedIndicesArr);

          const csvText = matrixToCsv(dataRows, ',');
          const buf = Buffer.from(csvText, 'utf8');

          const columnMappings = Array.from({ length: numCols }, (_, i) => {
            if (excludedSet.has(i)) return { columnIndex: i, role: 'excluded' };
            if (i === 0)
              return {
                columnIndex: i,
                role: 'timestamp',
                timestampType: 'datetime',
              };
            return {
              columnIndex: i,
              role: 'measurement',
              sensorConfigurationId: i + 1,
            };
          });

          const profile = { columnMappings };
          const result = Parser.parse(buf, profile);

          const expectedColCount = numCols - excludedSet.size;

          result.rows.forEach((row, rowIdx) => {
            should(row.length).equal(
              expectedColCount,
              `Row ${rowIdx} has ${row.length} columns but expected ${expectedColCount}. excludedIndices=${[...excludedSet]}`
            );
          });

          // Verify the kept values match the original data
          const keptIndices = Array.from(
            { length: numCols },
            (_, i) => i
          ).filter((i) => !excludedSet.has(i));
          result.rows.forEach((row, rowIdx) => {
            keptIndices.forEach((origIdx, newIdx) => {
              should(row[newIdx]).equal(
                dataRows[rowIdx][origIdx],
                `Row ${rowIdx} col ${newIdx} (orig ${origIdx}): expected '${dataRows[rowIdx][origIdx]}' got '${row[newIdx]}'`
              );
            });
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Locale-aware delimiter and decimal parsing
//
// For numeric values formatted in French locale (semicolons as delimiters,
// commas as decimals), the parser produces the correct raw string values.
//
// Validates: Requirements 3.4, 3.5, 3.6
// ---------------------------------------------------------------------------

/**
 * Generates a numeric string formatted for a given locale.
 *   - 'fr': integer part + "," + decimal part (e.g., "21,5")
 *   - 'en': integer part + "." + decimal part (e.g., "21.5")
 */
const numericValueArb = (locale) =>
  fc
    .record({
      intPart: fc.integer({ min: -9999, max: 9999 }),
      decPart: fc.integer({ min: 0, max: 9999 }),
    })
    .map(({ intPart, decPart }) => {
      const sep = locale === 'fr' ? ',' : '.';
      return `${intPart}${sep}${decPart}`;
    });

/**
 * A safe timestamp-like string: alphanumeric + spaces + dashes + colons,
 * but NO commas, semicolons, tabs or newlines (those are delimiters/specials).
 */
const safeTimestampArb = fc.stringMatching(/^[A-Za-z0-9 :_-]{1,20}$/);

/**
 * Property 4: Locale-aware delimiter and decimal parsing
 * Validates: Requirements 3.4, 3.5, 3.6
 */
describe('Parser - Property 4: Locale-aware delimiter and decimal parsing', () => {
  it('should correctly split French locale rows using semicolons as delimiter', function () {
    this.timeout(30000);

    fc.assert(
      fc.property(
        fc
          .integer({ min: 1, max: 10 }) // number of data rows
          .chain((numRows) =>
            fc.tuple(
              fc.array(safeTimestampArb, {
                minLength: numRows,
                maxLength: numRows,
              }),
              fc.array(numericValueArb('fr'), {
                minLength: numRows,
                maxLength: numRows,
              })
            )
          ),
        ([tsValues, numValues]) => {
          const numRows = tsValues.length;

          // Build CSV with semicolons (French locale)
          const lines = `${tsValues.map((ts, i) => `${ts};${numValues[i]}`).join('\n')}\n`;
          const buf = Buffer.from(lines, 'utf8');

          const profile = {
            numberLocale: 'fr',
            columnMappings: [
              { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
              { columnIndex: 1, role: 'measurement', sensorConfigurationId: 5 },
            ],
          };

          const result = Parser.parse(buf, profile);

          should(result.rows.length).equal(numRows);
          result.rows.forEach((row, i) => {
            should(row).have.length(2);
            should(row[0]).equal(tsValues[i], `Row ${i} timestamp mismatch`);
            should(row[1]).equal(
              numValues[i],
              `Row ${i} numeric value mismatch`
            );
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly split English locale rows using commas as delimiter', function () {
    this.timeout(30000);

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }).chain((numRows) =>
          fc.tuple(
            fc.array(safeTimestampArb, {
              minLength: numRows,
              maxLength: numRows,
            }),
            fc.array(numericValueArb('en'), {
              minLength: numRows,
              maxLength: numRows,
            })
          )
        ),
        ([tsValues, numValues]) => {
          const numRows = tsValues.length;

          // Build CSV with commas (English locale)
          const lines = `${tsValues.map((ts, i) => `${ts},${numValues[i]}`).join('\n')}\n`;
          const buf = Buffer.from(lines, 'utf8');

          const profile = {
            numberLocale: 'en',
            columnMappings: [
              { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
              { columnIndex: 1, role: 'measurement', sensorConfigurationId: 5 },
            ],
          };

          const result = Parser.parse(buf, profile);

          should(result.rows.length).equal(numRows);
          result.rows.forEach((row, i) => {
            should(row).have.length(2);
            should(row[0]).equal(tsValues[i], `Row ${i} timestamp mismatch`);
            should(row[1]).equal(
              numValues[i],
              `Row ${i} numeric value mismatch`
            );
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not split French numeric values (commas as decimals, not delimiter)', function () {
    this.timeout(30000);

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }).chain((numRows) =>
          fc.tuple(
            fc.array(safeTimestampArb, {
              minLength: numRows,
              maxLength: numRows,
            }),
            fc.array(numericValueArb('fr'), {
              minLength: numRows,
              maxLength: numRows,
            })
          )
        ),
        ([tsValues, numValues]) => {
          // Use semicolons as delimiters (fr locale)
          const lines = `${tsValues.map((ts, i) => `${ts};${numValues[i]}`).join('\n')}\n`;
          const buf = Buffer.from(lines, 'utf8');

          const profile = {
            numberLocale: 'fr',
            columnMappings: [
              { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
              { columnIndex: 1, role: 'measurement', sensorConfigurationId: 5 },
            ],
          };

          const result = Parser.parse(buf, profile);

          // Each row should have exactly 2 fields (comma in decimal value NOT treated as delimiter)
          result.rows.forEach((row, i) => {
            should(row).have.length(
              2,
              `Row ${i} should have 2 fields but got ${row.length}: ${JSON.stringify(row)}. ` +
                `French decimal value '${numValues[i]}' should not be split.`
            );
            should(row[1]).equal(
              numValues[i],
              `French decimal value should be preserved as-is`
            );
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
