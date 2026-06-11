/**
 * Parser service for the scientific data import pipeline.
 *
 * Decodes a file buffer, splits it into rows, detects the delimiter,
 * applies header/skip rules, parses quoted CSV fields, and filters
 * out excluded columns.
 *
 * This is a pure synchronous function — no DB access, no side effects.
 */

// Node.js encodings supported by Buffer.toString()
const SUPPORTED_ENCODINGS = new Set([
  'utf8',
  'utf-8',
  'ascii',
  'latin1',
  'binary',
  'base64',
  'hex',
  'ucs2',
  'ucs-2',
  'utf16le',
  'utf-16le',
]);

/**
 * Splits a raw CSV line into an array of field values, respecting
 * RFC 4180 quoting rules:
 *   - A field may be enclosed in double-quotes.
 *   - Inside a quoted field, "" represents a literal ".
 *   - A quoted field may contain the delimiter character.
 *
 * @param {string} line - A single CSV line.
 * @param {string} delimiter - Single-character delimiter.
 * @returns {string[]} Array of field values (quotes stripped, "" unescaped).
 */
function splitLine(line, delimiter) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        // Peek ahead — "" is an escaped quote inside a quoted field
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          // Closing quote
          inQuotes = false;
          i += 1;
        }
      } else {
        current += ch;
        i += 1;
      }
    } else if (ch === '"') {
      inQuotes = true;
      i += 1;
    } else if (ch === delimiter) {
      fields.push(current);
      current = '';
      i += 1;
    } else {
      current += ch;
      i += 1;
    }
  }

  fields.push(current);
  return fields;
}

/**
 * Detects the best delimiter for the file by examining the first data row.
 * Counts occurrences of comma, semicolon, and tab.
 * Tiebreak order: tab > semicolon > comma.
 *
 * @param {string} firstDataRow - The first row used for detection.
 * @returns {string} The detected delimiter character.
 */
function detectDelimiter(firstDataRow) {
  const commas = (firstDataRow.match(/,/g) || []).length;
  const semicolons = (firstDataRow.match(/;/g) || []).length;
  const tabs = (firstDataRow.match(/\t/g) || []).length;

  // Tiebreak: tab > semicolon > comma
  if (tabs >= semicolons && tabs >= commas) return '\t';
  if (semicolons >= commas) return ';';
  return ',';
}

/**
 * Parses the file buffer into structured rows.
 *
 * @param {Buffer} buffer - Raw file content.
 * @param {Object} profile - Profile with encoding, headerRow, skipFirstRows,
 *   skipLastRows, numberLocale, and columnMappings.
 * @returns {{
 *   rows: string[][],
 *   headerLabels: string[]|null,
 *   columnIndices: number[]
 * }}
 * @throws {Error} for encoding issues, empty file, or out-of-range headerRow.
 */
const parse = (buffer, profile) => {
  const {
    encoding = 'utf8',
    headerRow,
    skipFirstRows = 0,
    skipLastRows = 0,
    columnMappings = [],
  } = profile;

  // -------------------------------------------------------------------------
  // 2.2 — Buffer decoding
  // -------------------------------------------------------------------------
  const normalizedEncoding = encoding.toLowerCase();
  if (!SUPPORTED_ENCODINGS.has(normalizedEncoding)) {
    throw new Error(
      `Unsupported encoding: '${encoding}'. Supported encodings are: ${[...SUPPORTED_ENCODINGS].join(', ')}.`
    );
  }

  let text;
  try {
    text = buffer.toString(normalizedEncoding);
  } catch (err) {
    throw new Error(
      `Failed to decode file with encoding '${encoding}': ${err.message}`
    );
  }

  // -------------------------------------------------------------------------
  // 2.3 — Line splitting (handle \r\n, \n, \r)
  // -------------------------------------------------------------------------
  const allLines = text.split(/\r\n|\r|\n/);

  // Remove trailing empty lines
  let lastNonEmpty = allLines.length - 1;
  while (lastNonEmpty >= 0 && allLines[lastNonEmpty].trim() === '') {
    lastNonEmpty -= 1;
  }
  const lines = allLines.slice(0, lastNonEmpty + 1);

  // -------------------------------------------------------------------------
  // 2.5 — headerRow handling (1-based)
  // headerRow is 1-based: row 1 is lines[0].
  // Rows before headerRow are skipped. headerRow itself is the header.
  // Data rows are those AFTER headerRow.
  // If headerRow is not provided, all lines are data rows (no header).
  // -------------------------------------------------------------------------
  let headerLabels = null;
  let dataLines;

  if (headerRow != null) {
    if (headerRow > lines.length) {
      throw new Error(
        `headerRow (${headerRow}) exceeds the total number of lines in the file (${lines.length}).`
      );
    }
    // lines are 0-indexed; headerRow is 1-based → headerRow - 1 is the index
    const headerLineIndex = headerRow - 1;
    // Data lines start immediately after the header line
    dataLines = lines.slice(headerLineIndex + 1);
  } else {
    dataLines = lines.slice();
  }

  // -------------------------------------------------------------------------
  // 2.4 — Delimiter detection (single computation for the whole file)
  //        numberLocale does NOT influence delimiter choice — a French-locale
  //        file can use any delimiter (comma, semicolon, tab) because the
  //        RFC 4180 parser handles quoted fields containing commas.
  //        numberLocale only affects decimal parsing in SIConverter.
  // -------------------------------------------------------------------------
  const firstDataLine = dataLines.find((l) => l.trim() !== '') || '';
  // Prefer a data line for detection; fall back to the header line when
  // there are no data lines (e.g., file with only a header).
  const detectionLine =
    firstDataLine || (headerRow != null ? lines[headerRow - 1] : '');
  const delimiter = detectDelimiter(detectionLine);

  // Parse header with the detected delimiter
  if (headerRow != null) {
    headerLabels = splitLine(lines[headerRow - 1], delimiter);
  }

  // -------------------------------------------------------------------------
  // 2.6 — skipFirstRows: remove the first N rows from data rows
  //        (rows immediately after the header, e.g. units row or metadata)
  // -------------------------------------------------------------------------
  const afterSkipFirst =
    skipFirstRows > 0 ? dataLines.slice(skipFirstRows) : dataLines;

  // -------------------------------------------------------------------------
  // 2.7 — skipLastRows: remove the last N rows from data rows
  // -------------------------------------------------------------------------
  const trimmedDataLines =
    skipLastRows > 0
      ? afterSkipFirst.slice(0, afterSkipFirst.length - skipLastRows)
      : afterSkipFirst;

  // -------------------------------------------------------------------------
  // 2.8 — Determine which column indices to keep (filter excluded columns)
  // -------------------------------------------------------------------------
  const excludedIndices = new Set(
    columnMappings
      .filter((m) => m.role === 'excluded')
      .map((m) => m.columnIndex)
  );

  // -------------------------------------------------------------------------
  // 2.7 + 2.8 — Split each data row and filter excluded columns
  // -------------------------------------------------------------------------
  const rows = trimmedDataLines
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const fields = splitLine(line, delimiter);
      return fields.filter((_, idx) => !excludedIndices.has(idx));
    });

  // Build the list of original column indices that were kept
  // We derive this from the first parsed row length (or from columnMappings)
  // Use the raw field count from the first non-empty line
  let totalColumns = 0;
  if (trimmedDataLines.length > 0) {
    const firstNonEmpty = trimmedDataLines.find((l) => l.trim() !== '');
    if (firstNonEmpty) {
      totalColumns = splitLine(firstNonEmpty, delimiter).length;
    }
  } else if (headerRow != null && lines[headerRow - 1]) {
    totalColumns = splitLine(lines[headerRow - 1], delimiter).length;
  }

  const columnIndices = Array.from(
    { length: totalColumns },
    (_, i) => i
  ).filter((i) => !excludedIndices.has(i));

  // Filter headerLabels to match kept column indices
  if (headerLabels !== null) {
    headerLabels = headerLabels.filter((_, idx) => !excludedIndices.has(idx));
  }

  // -------------------------------------------------------------------------
  // 2.9 — Throw error if zero parseable data rows remain
  // -------------------------------------------------------------------------
  if (rows.length === 0) {
    throw new Error(
      'The file contains no parseable data rows after applying header and skip-row rules.'
    );
  }

  return { rows, headerLabels, columnIndices };
};

module.exports = { parse };
