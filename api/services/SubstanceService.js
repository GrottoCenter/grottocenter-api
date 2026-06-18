const CommonService = require('./CommonService');

/**
 * Maps a raw database row from t_substance to the API response shape.
 * @param {Object} row - Raw row with snake_case column names
 * @returns {{id, name, formula, casNumber, externalId, externalSource}}
 */
const mapRow = (row) => ({
  id: row.id,
  name: row.name,
  formula: row.formula || null,
  casNumber: row.cas_number || null,
  externalId: row.external_id || null,
  externalSource: row.external_source || null,
});

module.exports = {
  /**
   * Search local substances by name/formula/cas_number.
   * If no local results and user is authenticated, falls back to PubChem.
   *
   * @param {string|null} search - Search string (min 2 chars if provided)
   * @param {boolean} isAuthenticated - Whether PubChem fallback is allowed
   * @returns {Promise<Array<{id, name, formula, casNumber, externalId, externalSource}>>}
   */
  search: async (search, isAuthenticated) => {
    let result;

    if (!search) {
      // No search string: return all substances ordered by name, limited to 50
      result = await CommonService.query(
        'SELECT * FROM t_substance ORDER BY name ASC LIMIT 50'
      );
      return result.rows.map(mapRow);
    }

    // Escape LIKE metacharacters (%, _, \) before wrapping with wildcards
    const escapedSearch = search.replace(/[%_\\]/g, '\\$&');
    const pattern = `%${escapedSearch}%`;
    result = await CommonService.query(
      `SELECT * FROM t_substance
       WHERE name ILIKE $1 OR formula ILIKE $1 OR cas_number ILIKE $1
       ORDER BY name ASC
       LIMIT 20`,
      [pattern]
    );

    if (result.rows.length > 0) {
      return result.rows.map(mapRow);
    }

    // No local results: fall back to PubChem if authenticated
    if (isAuthenticated) {
      const pubChemResults = await PubChemService.search(search);
      return pubChemResults.map((item) => ({
        id: null,
        name: item.name,
        formula: item.formula || null,
        casNumber: item.casNumber || null,
        externalId: item.externalId || null,
        externalSource: item.externalSource || null,
      }));
    }

    return [];
  },

  /**
   * Create or return existing substance by case-insensitive name match.
   *
   * @param {{name, formula?, casNumber?, externalId?, externalSource?}} data
   * @param {number} authorId - Authenticated user's caver ID
   * @returns {Promise<{substance: Object, created: boolean}>}
   */
  createOrFind: async (data, authorId) => {
    // Normalize name: capitalize first letter for display consistency
    const normalizedName =
      data.name.charAt(0).toUpperCase() + data.name.slice(1);

    // Case-insensitive name lookup
    const existing = await CommonService.query(
      'SELECT * FROM t_substance WHERE LOWER(name) = LOWER($1)',
      [normalizedName]
    );

    if (existing.rows.length > 0) {
      return { substance: mapRow(existing.rows[0]), created: false };
    }

    // Determine externalSource based on externalId presence
    const externalSource = data.externalId ? 'PubChem' : null;

    try {
      const newSubstance = await TSubstance.create({
        name: normalizedName,
        formula: data.formula || null,
        casNumber: data.casNumber || null,
        externalId: data.externalId || null,
        externalSource,
        author: authorId,
        dateInscription: new Date(),
      }).fetch();

      return {
        substance: {
          id: newSubstance.id,
          name: newSubstance.name,
          formula: newSubstance.formula || null,
          casNumber: newSubstance.casNumber || null,
          externalId: newSubstance.externalId || null,
          externalSource: newSubstance.externalSource || null,
        },
        created: true,
      };
    } catch (err) {
      // Handle race condition: concurrent insert with same name
      if (err.code === 'E_UNIQUE') {
        const retry = await CommonService.query(
          'SELECT * FROM t_substance WHERE LOWER(name) = LOWER($1)',
          [normalizedName]
        );
        if (retry.rows.length > 0) {
          return { substance: mapRow(retry.rows[0]), created: false };
        }
      }
      throw err;
    }
  },

  /**
   * Find a substance by ID.
   *
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  findById: async (id) => {
    const substance = await TSubstance.findOne({ id });
    return substance || null;
  },
};
