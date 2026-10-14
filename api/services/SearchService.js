const typesense = require('../../config/typesense');
const searchDocuments = require('../dbSync/searchDocuments');

const allEntities = Object.fromEntries(
  Object.entries(searchDocuments.ENTITIES).map(([name, e]) => [name, e.search])
);
const allEntitiesKeys = Object.keys(allEntities);

// Typesense caps how many distinct index words a prefix/typo query may expand
// to. The server default depends on the collection size: 10 below 500k
// documents, 4 at or above (NUM_CANDIDATES_DEFAULT_MAX/MIN in src/collection.cpp).
// With identifier-like names such as GZ301, GZ302, … every value is its own
// word matching a single document, so the default silently caps a search at 10
// hits whatever per_page asks for. 1000 is upstream's own recommendation and
// costs ~18ms worst case on a 150k collection; exhaustive_search is not a
// substitute as it also exhausts typo variants and so degrades precision.
const MAX_CANDIDATES = 1000;

function buildFilter(filter, isLogicalCompareAnd = true) {
  let hasPrefixFilter = false;
  const out = Object.entries(filter)
    .filter(([, v]) => {
      if (v === null || v === undefined) return false;
      if (typeof v === 'string') return v.trim().length > 0;
      return true;
    })
    .flatMap(([k, v]) => {
      // For datePublication, use a prefix filter so that partial dates
      // (year, year-month, or full date) match all more-specific entries.
      // e.g. "2025" matches "2025", "2025-01", "2025-01-15", etc.
      // Typesense supports prefix matching on string fields with := and *.
      const trimmed = typeof v === 'string' ? v.trim() : v;

      if (k === 'datePublication' && typeof trimmed === 'string') {
        hasPrefixFilter = true;
        return [`${k}:=${trimmed}*`];
      }

      let vFmt = trimmed;
      let operator = ':'; // Partial equal
      if (Array.isArray(trimmed)) {
        if (trimmed.length === 0) return []; // Skip empty arrays
        const isNumericRange =
          trimmed.length === 2 && trimmed.every((el) => typeof el === 'number');
        if (isNumericRange) {
          vFmt = `[${trimmed.join('..')}]`; // Numeric range
        } else {
          // Multi-value exact match (non-numeric-range arrays)
          operator = ':=';
          vFmt = `[${trimmed.map((el) => `\`${String(el).replace(/`/g, '')}\``).join(',')}]`;
        }
      } else if (typeof trimmed === 'boolean' || typeof trimmed === 'number')
        operator = ':='; // Exact equal
      else vFmt = `\`${trimmed.replace(/`/g, '')}\``;
      return [`${k}${operator}${vFmt}`];
    });
  return {
    filterBy: out.join(isLogicalCompareAnd ? ' && ' : ' || '),
    hasPrefixFilter,
  };
}

async function isAlive() {
  return typesense.isAlive();
}

/**
 * Bring the search documents of the given ids up to date from the database:
 * upsert those the full rebuild would index, remove the others.
 * Throws when Typesense cannot be reached, so the caller can retry; a document
 * Typesense rejects is only logged (typesense.importDocuments). It only
 * returns or throws once no request it sent is still running.
 *
 * @param {string} collectionName search collection (entrances, caves…)
 * @param {Array<number|string>} ids
 * @param {Object} [options]
 * @param {Function} [options.shouldStop] asked before each step that calls
 *   Typesense (the import, the removals): when it returns true, the sync
 *   throws an error with `code: 'E_SEARCH_SYNC_STOPPED'` instead
 */
async function syncDocuments(
  collectionName,
  ids,
  { shouldStop = () => false } = {}
) {
  if (!allEntitiesKeys.includes(collectionName)) return;
  const stopIfAsked = () => {
    if (shouldStop()) {
      throw Object.assign(new Error('Search sync stopped'), {
        code: 'E_SEARCH_SYNC_STOPPED',
      });
    }
  };
  const { documents, removedIds } = await searchDocuments.planSync(
    collectionName,
    ids
  );
  if (documents.length > 0) {
    stopIfAsked();
    await typesense.importDocuments(
      collectionName,
      documents,
      allEntities[collectionName].importFormater
    );
  }
  if (removedIds.length > 0) {
    stopIfAsked();
    // Every removal settles before a failure is reported: a caller that
    // retries must not race a removal still in flight
    const results = await Promise.allSettled(
      removedIds.map((id) => typesense.deleteDocument(collectionName, id))
    );
    const failure = results.find((r) => r.status === 'rejected');
    if (failure) throw failure.reason;
  }
}

async function multiCollectionsSearch({
  query,
  entities = [],
  filter = {},
} = {}) {
  // eslint-disable-next-line no-param-reassign
  entities = entities.filter((e) => allEntitiesKeys.includes(e));
  if (entities.length === 0) return null;
  const q = query || '*';
  const { filterBy, hasPrefixFilter } = buildFilter(filter);

  const collections = entities.map((e) => ({
    collection: e,
    query_by: allEntities[e].query.query_by,
    ...(filterBy && { filter_by: filterBy }),
  }));

  return typesense.multiSearch(collections, {
    per_page: 20,
    q,
    max_candidates: MAX_CANDIDATES,
    // Typesense defaults max_filter_by_candidates to 4, which is too low
    // for prefix filters like datePublication:=2025* that can match many
    // distinct values (2025, 2025-01, …, 2025-12, 2025-01-15, etc.).
    ...(hasPrefixFilter && { max_filter_by_candidates: 100 }),
  });
}

async function collectionSearch({
  query,
  entity = [],
  sort,
  filter = {},
  isLogicalCompareAnd = true,
  page,
  size,
  fields,
} = {}) {
  if (!allEntitiesKeys.includes(entity)) return null;
  const q = query || '*';
  const { filterBy, hasPrefixFilter } = buildFilter(
    filter,
    isLogicalCompareAnd
  );

  // Cap size at Typesense's limit of 1000 hits per page
  const perPage = size ? Math.min(size, 1000) : size;

  const params = {
    q,
    query_by: allEntities[entity].query.query_by,
    page, // Page starts at 1
    per_page: perPage,
    max_candidates: MAX_CANDIDATES,
    ...(sort && { sort_by: `${sort},_text_match:desc` }),
    ...(filterBy && { filter_by: filterBy }),
    ...(fields && { include_fields: fields.join(',') }),
    // Typesense defaults max_filter_by_candidates to 4, which is too low
    // for prefix filters like datePublication:=2025* that can match many
    // distinct values (2025, 2025-01, …, 2025-12, 2025-01-15, etc.).
    ...(hasPrefixFilter && { max_filter_by_candidates: 100 }),
  };

  return typesense.search(entity, params);
}

async function fieldSearch({
  entity,
  field,
  query,
  filter = {},
  size,
  isLogicalCompareAnd = true,
} = {}) {
  if (!allEntitiesKeys.includes(entity)) return null;
  if (!field) return null;
  const q = query || '*';
  const { filterBy, hasPrefixFilter } = buildFilter(
    filter,
    isLogicalCompareAnd
  );

  // Use faceted search to get distinct values for the field.
  // The previous approach (query_by + group_by) caused wrong results on
  // array fields like massifs.name: a token-based text search would match
  // documents containing other massif names that share tokens (e.g. "causse"),
  // then group_by would surface those unrelated massif names.
  // Facet search matches against the actual facet values, not document text.

  // Cap max_facet_values at 100 to avoid surfacing raw Typesense validation
  // errors for out-of-range values (mirrors collectionSearch's per_page cap).
  const maxFacetValues = size ? Math.min(size, 100) : size;

  const params = {
    q: '*',
    // query_by is required by the Typesense API even for wildcard queries;
    // it does not participate in matching when q is '*'.
    query_by: field,
    facet_by: field,
    max_facet_values: maxFacetValues,
    per_page: 0, // We only need facet counts, not document hits
    // facet_query prefix-matches facet values and is subject to the same
    // candidate cap as a regular query, so it needs max_candidates too.
    max_candidates: MAX_CANDIDATES,
    ...(q !== '*' && { facet_query: `${field}:${q}` }),
    ...(filterBy && { filter_by: filterBy }),
    ...(hasPrefixFilter && { max_filter_by_candidates: 100 }),
  };

  const result = await typesense.search(entity, params);

  // Transform facet response to match the grouped_hits format expected by
  // the controller. The controller reads: found, found_docs, grouped_hits, page.
  const facetInfo = result.facet_counts?.find((f) => f.field_name === field);
  const counts = facetInfo?.counts ?? [];

  // found_docs: sum of document counts for the returned facet values.
  // Note: on array fields (e.g. massifs.name), a document with multiple
  // matching values is counted once per value, so this may exceed the true
  // distinct document count. This is acceptable for the UI's display purpose.
  const totalDocuments = counts.reduce((sum, c) => sum + c.count, 0);

  // Use stats.total_values for the count of distinct facet values matching the
  // query: unlike counts, it is not capped by max_facet_values. It is not exact
  // either, and for two independent reasons. With a facet_query it is bounded by
  // max_candidates above. And Typesense's default `automatic` facet strategy
  // falls back to top_values when it judges the field cheap enough to intersect,
  // which caps total_values at max_facet_values whatever the candidate budget is
  // — only facet_strategy: exhaustive reports a true count. Treat it as a lower
  // bound rather than a total.
  const totalDistinct = facetInfo?.stats?.total_values ?? counts.length;

  return {
    found: totalDistinct,
    found_docs: totalDocuments,
    grouped_hits: counts.map((c) => ({
      group_key: [c.value],
      found: c.count,
    })),
    page: result.page,
  };
}

module.exports = {
  allEntities,
  allEntitiesKeys,

  isAlive,

  syncDocuments,

  multiCollectionsSearch,
  collectionSearch,
  fieldSearch,
};
