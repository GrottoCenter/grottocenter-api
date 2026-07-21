const SearchService = require('../../../services/SearchService');
const {
  handleTypesenseError,
} = require('../../../services/TypesenseErrorService');
const {
  serializers,
  filterDocuments,
} = require('../../../services/geo-serializers');

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

const VALID_FORMATS = ['csv', 'geojson', 'kml', 'gpx'];
const GEO_FORMATS = ['geojson', 'kml', 'gpx'];
const BATCH_SIZE = 1000;
const MAX_NB_ROW_EXPORT = 10000;

/**
 * Validate columns and columnsName arrays.
 * Returns an error message string if invalid, or null if valid.
 *
 * @param {Array} columns - Column keys
 * @param {Array|null} columnsName - Column display names (optional for geo formats)
 * @param {object} options
 * @param {boolean} options.requireColumnsName - Whether columnsName is mandatory
 * @returns {string|null} Error message or null
 */
function validateColumns(columns, columnsName, { requireColumnsName }) {
  const hasColumns = Array.isArray(columns) && columns.length > 0;
  const hasColumnsName = Array.isArray(columnsName) && columnsName.length > 0;

  if (!hasColumns) {
    return 'columns must be a non-empty array';
  }
  if (!columns.every((c) => typeof c === 'string' && c.length > 0)) {
    return 'each element in columns must be a non-empty string';
  }
  if (requireColumnsName && !hasColumnsName) {
    return 'columnsName must be a non-empty array';
  }
  if (hasColumnsName) {
    if (columns.length !== columnsName.length) {
      return 'columns and columnsName must have the same length';
    }
    if (!columnsName.every((c) => typeof c === 'string' && c.length > 0)) {
      return 'each element in columnsName must be a non-empty string';
    }
  }
  return null;
}

module.exports = async (req, res) => {
  const format = req.param('format') || 'csv';
  const entity = req.param('entity') ?? '';

  // 1. Format validation
  if (!VALID_FORMATS.includes(format)) {
    res.badRequest('format must be one of: csv, geojson, kml, gpx');
    return;
  }

  const isGeoFormat = GEO_FORMATS.includes(format);

  // 2. Entity restriction for geo formats
  if (isGeoFormat && entity !== 'entrances') {
    res.badRequest(
      'Geographic formats (geojson, kml, gpx) are only available for entrance searches'
    );
    return;
  }

  // 3. Column validation
  let matchAllFields = req.param('matchAllFields') ?? true;
  if (!matchAllFields || matchAllFields === 'false') matchAllFields = false;
  const columns = req.param('columns');
  const columnsName = req.param('columnsName');

  const hasColumns = Array.isArray(columns) && columns.length > 0;
  const hasColumnsName = Array.isArray(columnsName) && columnsName.length > 0;

  if (!isGeoFormat) {
    const error = validateColumns(columns, columnsName, {
      requireColumnsName: true,
    });
    if (error) {
      res.badRequest(error);
      return;
    }
  }

  // For geo formats with columns provided, validate and build field mapping
  let fieldMapping = null;
  if (isGeoFormat && hasColumns) {
    const error = validateColumns(columns, columnsName, {
      requireColumnsName: false,
    });
    if (error) {
      res.badRequest(error);
      return;
    }
    if (hasColumnsName) {
      fieldMapping = columns.map((key, i) => ({ key, alias: columnsName[i] }));
    } else {
      fieldMapping = columns.map((key) => ({ key, alias: key }));
    }
  }

  // Geo streaming path
  if (isGeoFormat) {
    const serializer = serializers[format];
    const timestamp = new Date().toISOString();

    const geoParams = {
      query: req.param('query'),
      entity,
      sort: req.param('sort'),
      filter: req.param('filter') ?? {},
      isLogicalCompareAnd: !!matchAllFields,
    };

    let hasSentHeader = false;
    let isFirst = true;
    let page = 1;
    for (;;) {
      let results;
      try {
        // eslint-disable-next-line no-await-in-loop
        results = await SearchService.collectionSearch({
          ...geoParams,
          page,
          size: BATCH_SIZE,
        });
      } catch (err) {
        if (!hasSentHeader && handleTypesenseError(res, err)) return;
        if (hasSentHeader) {
          sails.log.error('Export to geo format error after headers sent', err);
          break;
        }
        results = err;
      }

      if (!results || !results.hits) {
        sails.log.error('Export to geo format error', geoParams, page, results);
        if (!hasSentHeader) {
          res.serverError('An internal error occurred');
          return;
        }
        break;
      }

      // Total result count check — only meaningful on the first page
      // (results.found is constant across pages).
      if (!hasSentHeader && results.found > MAX_NB_ROW_EXPORT) {
        res.badRequest(
          `To be exported a search cannot contain more than ${MAX_NB_ROW_EXPORT} results`
        );
        return;
      }

      if (!hasSentHeader) {
        hasSentHeader = true;
        res.set({
          'Content-Type': serializer.contentType,
          'Content-Disposition': `attachment; filename="Grottocenter_search_export_${Math.trunc(Date.now() / 1000)}.${serializer.fileExtension}"`,
        });
        res.write(serializer.prologue(timestamp));
      }

      const documents = results.hits.map((e) => e.document);
      const filtered = filterDocuments(documents);

      // When fieldMapping is set, resolve dot-notation keys and apply aliases
      // so serializers receive pre-resolved documents with aliased field names.
      let docsToSerialize = filtered;
      if (fieldMapping) {
        docsToSerialize = filtered.map((doc) => {
          // Only include coordinates and id for geometry construction;
          // aliased fields are the sole user-visible properties.
          // KML/GPX also need the entrance name for the <name> element.
          const mapped = {
            id: doc.id,
            latitude: doc.latitude,
            longitude: doc.longitude,
          };
          if (doc.altitude != null) {
            mapped.altitude = doc.altitude;
          }
          if (format === 'kml' || format === 'gpx') {
            mapped.name = doc.name;
          }
          fieldMapping.forEach(({ key, alias }) => {
            mapped[alias] = resolveField(doc, key);
          });
          return mapped;
        });
      }
      res.write(serializer.serializeBatch(docsToSerialize, isFirst));
      isFirst = false;

      if (documents.length < BATCH_SIZE) break;
      page += 1;
    }

    if (!hasSentHeader) {
      res.set({
        'Content-Type': serializer.contentType,
        'Content-Disposition': `attachment; filename="Grottocenter_search_export_${Math.trunc(Date.now() / 1000)}.${serializer.fileExtension}"`,
      });
      res.write(serializer.prologue(timestamp));
    }
    res.write(serializer.epilogue());
    res.end();
    return;
  }

  const params = {
    query: req.param('query'),
    entity,
    sort: req.param('sort'),
    filter: req.param('filter') ?? {},
    isLogicalCompareAnd: !!matchAllFields,
    fields: columns,
  };

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

    // Total result count check — only meaningful on the first page
    // (results.found is constant across pages).
    if (!hasSentHeader && results.found > MAX_NB_ROW_EXPORT) {
      res.badRequest(
        `To be exported a search cannot contain more than ${MAX_NB_ROW_EXPORT} results`
      );
      return;
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

    if (documents.length < BATCH_SIZE) break;
    page += 1;
  }

  res.end();
};
