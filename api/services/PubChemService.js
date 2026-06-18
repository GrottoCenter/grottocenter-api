const PUBCHEM_BASE_URL = 'https://pubchem.ncbi.nlm.nih.gov/rest';
const AUTOCOMPLETE_URL = `${PUBCHEM_BASE_URL}/autocomplete/compound`;
const PUG_URL = `${PUBCHEM_BASE_URL}/pug/compound`;
const TIMEOUT_MS = 5000;
const MAX_RESULTS = 10;

/**
 * Perform a fetch request with a timeout using AbortController.
 * @param {string} url
 * @param {number} timeoutMs
 * @returns {Promise<Response>}
 */
const fetchWithTimeout = async (url, timeoutMs) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Get compound names matching the query via PubChem autocomplete.
 * @param {string} query
 * @returns {Promise<string[]>}
 */
const getAutocompleteNames = async (query) => {
  const url = `${AUTOCOMPLETE_URL}/${encodeURIComponent(query)}/json?limit=${MAX_RESULTS}`;
  const response = await fetchWithTimeout(url, TIMEOUT_MS);
  if (!response.ok) {
    throw new Error(`PubChem autocomplete HTTP ${response.status}`);
  }
  const data = await response.json();
  const names = data && data.dictionary_terms && data.dictionary_terms.compound;
  return Array.isArray(names) ? names.slice(0, MAX_RESULTS) : [];
};

/**
 * Lookup molecular formula and CID for a compound name via PubChem PUG REST.
 * @param {string} name
 * @returns {Promise<{formula: string|null, cid: string|null}>}
 */
const getCompoundProperties = async (name) => {
  const url = `${PUG_URL}/name/${encodeURIComponent(name)}/property/MolecularFormula/JSON`;
  const response = await fetchWithTimeout(url, TIMEOUT_MS);
  if (!response.ok) {
    return { formula: null, cid: null };
  }
  const data = await response.json();
  const properties =
    data &&
    data.PropertyTable &&
    data.PropertyTable.Properties &&
    data.PropertyTable.Properties[0];
  if (!properties) {
    return { formula: null, cid: null };
  }
  return {
    formula: properties.MolecularFormula || null,
    cid: properties.CID != null ? String(properties.CID) : null,
  };
};

module.exports = {
  /**
   * Search PubChem for substances matching a query string.
   * Returns at most 10 candidates. Gracefully returns [] on timeout/error.
   * @param {string} query - Search term (≥2 chars)
   * @returns {Promise<Array<{name, formula, casNumber, externalId, externalSource}>>}
   */
  search: async (query) => {
    try {
      const names = await getAutocompleteNames(query);
      if (names.length === 0) {
        return [];
      }

      const results = await Promise.all(
        names.map(async (name) => {
          try {
            const { formula, cid } = await getCompoundProperties(name);
            return {
              name,
              formula,
              casNumber: null,
              externalId: cid,
              externalSource: cid ? 'PubChem' : null,
            };
          } catch {
            return {
              name,
              formula: null,
              casNumber: null,
              externalId: null,
              externalSource: null,
            };
          }
        })
      );

      return results;
    } catch (error) {
      sails.log.warn(
        `PubChemService.search failed for query "${query}":`,
        error.message
      );
      return [];
    }
  },
};
