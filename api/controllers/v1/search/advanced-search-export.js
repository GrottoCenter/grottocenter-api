const SearchService = require('../../../services/SearchService');

function escapeCSV(v) {
  // Escape double quotes
  const escaped = String(v ?? '').replace(/"/g, '""');
  // Quote if it contains a comma, quote, or newline
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

/**
 * Resolve a dot-notation key from a Typesense document.
 * Typesense with enable_nested_fields returns nested structures,
 * e.g. "authors.nickname" is stored as authors: [{ nickname: "X" }].
 * This function traverses the path and flattens arrays of primitives
 * into a semicolon-separated string suitable for CSV.
 */
function resolveField(doc, key) {
  // Try flat key first (works for simple fields like "title", "id")
  if (Object.prototype.hasOwnProperty.call(doc, key)) return doc[key];

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
    // eslint-disable-next-line no-await-in-loop
    const results = await SearchService.collectionSearch({
      ...params,
      page,
      size: BATCH_SIZE,
    }).catch((err) => err);

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
