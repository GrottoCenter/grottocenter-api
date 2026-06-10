const SearchService = require('../../../services/SearchService');
const {
  handleTypesenseError,
} = require('../../../services/TypesenseErrorService');

function escapeCSV(v) {
  // Escape double quotes
  const escaped = String(v ?? '').replace(/"/g, '""');
  // Quote if it contains a comma, quote, or newline
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

/**
 * Convert a value to a CSV-safe primitive.
 * - primitives pass through
 * - arrays of primitives are joined with "; "
 * - plain objects are stringified by picking the first string-valued field
 * - arrays of objects: extract the first string field from each, then join
 */
function toPrimitive(val) {
  if (val == null) return val;
  if (typeof val !== 'object') return val;

  if (Array.isArray(val)) {
    const flat = val.map((item) => toPrimitive(item)).filter((v) => v != null);
    return flat.join('; ');
  }

  // Plain object — pick the first string-valued property as a display value
  const strVal = Object.values(val).find((v) => typeof v === 'string');
  return strVal ?? JSON.stringify(val);
}

/**
 * Resolve a dot-notation key from a Typesense document.
 * Typesense with enable_nested_fields returns nested structures,
 * e.g. "authors.nickname" is stored as authors: [{ nickname: "X" }].
 * This function traverses the path and flattens arrays of primitives
 * into a semicolon-separated string suitable for CSV.
 *
 * Also handles the case where a parent key (e.g. "authors") is requested
 * instead of a nested path (e.g. "authors.nickname") — objects and arrays
 * of objects are coerced to readable strings.
 */
function resolveField(doc, key) {
  // For dot-notation keys, always traverse the nested structure
  if (key.includes('.')) {
    const parts = key.split('.');
    let current = doc[parts[0]];
    for (let i = 1; i < parts.length && current != null; i += 1) {
      if (Array.isArray(current)) {
        // Extract the sub-field from each element in the array
        current = current
          .map((item) => item?.[parts[i]])
          .filter((v) => v != null);
      } else {
        current = current[parts[i]];
      }
    }

    if (Array.isArray(current)) return current.join('; ');
    return current;
  }

  // Simple key — return directly, but coerce objects to readable strings
  return toPrimitive(doc[key]);
}

function documentsToCSV(documents, columns) {
  const csvRows = documents
    .map((doc) => {
      const row = [];
      for (const key of columns) {
        row.push(escapeCSV(resolveField(doc, key)));
      }
      return row.join(',');
    })
    .join('\n');

  return csvRows;
}

module.exports = async (req, res) => {
  let matchAllFields = req.param('matchAllFields') ?? true;
  if (!matchAllFields || matchAllFields === 'false') matchAllFields = false;
  const columns = req.param('columns');
  const columnsName = req.param('columnsName');

  if (!Array.isArray(columns) || columns.length === 0) {
    res.badRequest('columns must be a non-empty array');
    return;
  }
  if (!Array.isArray(columnsName) || columnsName.length === 0) {
    res.badRequest('columnsName must be a non-empty array');
    return;
  }

  const params = {
    query: req.param('query'),
    entity: req.param('entity') ?? '',
    sort: req.param('sort'),
    filter: req.param('filter') ?? {},
    isLogicalCompareAnd: !!matchAllFields,
    fields: columns,
  };

  const BATCH_SIZE = 1000;
  const MAX_NB_ROW_EXPORT = 10000;

  let hasSentHeader = false;
  let page = 1;
  for (;;) {
    let results;
    try {
      // eslint-disable-next-line no-await-in-loop
      results = await SearchService.collectionSearch({
        ...params,
        page,
        size: BATCH_SIZE,
      });
    } catch (err) {
      if (!hasSentHeader && handleTypesenseError(res, err)) return;
      if (hasSentHeader) break;
      results = err;
    }

    if (!results || !results.hits) {
      sails.log.error('Export to CSV error', params, page, results);
      if (!hasSentHeader) {
        res.serverError('An internal error occurred');
        return;
      }
      break;
    }

    if (results.found > MAX_NB_ROW_EXPORT) {
      if (!hasSentHeader) {
        res.badRequest(
          `To be exported a search cannot contain more than ${MAX_NB_ROW_EXPORT} results`
        );
        return;
      }
      break;
    }

    if (!hasSentHeader) {
      hasSentHeader = true;
      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="Grottocenter_search_export_${Math.trunc(Date.now() / 1000)}.csv"`,
      });
      res.write('\uFEFF'); // Prepend BOM for Excel compatibility
      res.write(`${columnsName.map((e) => escapeCSV(e)).join(',')}\n`); // Header
    }

    const documents = results.hits.map((e) => e.document);
    res.write(documentsToCSV(documents, columns));

    if (documents.length !== BATCH_SIZE) break;
    page += 1;
  }

  res.end();
};
