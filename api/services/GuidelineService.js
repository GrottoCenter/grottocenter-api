const CaveService = require('./CaveService');
const NameService = require('./NameService');

module.exports = {
  /**
   * Entity types a guideline can be attached to. Shared so controllers validate
   * against a single source of truth instead of redefining the list.
   */
  VALID_ENTITY_TYPES: ['country', 'region', 'massif'],

  /**
   * Validate that all values in the array are positive finite numbers.
   * Used by create/update controllers after mapping raw massif params through Number().
   * @param {Array<number>} massifIds - The mapped massif IDs
   * @returns {boolean} True if all IDs are valid positive numbers
   */
  validateMassifIds: (massifIds) =>
    massifIds.every((m) => Number.isFinite(m) && m > 0),

  /**
   * Fetch a single guideline by its ID, populating author, reviewer, and associated entities.
   * @param {number} id - The ID of the guideline
   * @returns {Promise<Object|null>} The guideline record or null
   */
  getGuideline: async (id) =>
    TGuideline.findOne({ id })
      .populate('author')
      .populate('reviewer')
      .populate('countries')
      .populate('regions')
      .populate('massifs'),

  /**
   * Fetch a single guideline for the public detail endpoint.
   *
   * Adds two hydrations on top of getGuideline that only the detail view needs
   * (see toGuideline): `language`, so the response can carry its readable
   * `refName` instead of the bare FK code, and the massifs' names, which live
   * in the separate t_name table. Kept separate from getGuideline so the
   * create/update/rollback/restore/delete responses — which all use the leaner
   * toSimpleGuideline shape — are unaffected.
   *
   * Massif names are resolved in a single batched query via NameService rather
   * than one lookup per massif, so this stays free of N+1 queries.
   * @param {number} id - The ID of the guideline
   * @returns {Promise<Object|null>} The guideline record or null/undefined
   */
  getGuidelineDetail: async (id) => {
    const guideline = await TGuideline.findOne({ id })
      .populate('author')
      .populate('reviewer')
      .populate('countries')
      .populate('regions')
      .populate('massifs')
      .populate('language');
    if (!guideline) return guideline;
    await NameService.setNames(guideline.massifs, 'massif');
    return guideline;
  },

  /**
   * Fetch all history snapshots for a given guideline ID, populating author and reviewer.
   * @param {number} guidelineId - The ID of the target guideline
   * @returns {Promise<Array>} List of history snapshots
   */
  getGuidelineHistory: async (guidelineId) =>
    HGuideline.find({ t_id: guidelineId })
      .sort('id DESC')
      .populate('author')
      .populate('reviewer'),

  /**
   * Fetch all non-deleted guidelines for a specific entity (country, region, massif).
   * @param {string} entityType - One of 'country', 'region', 'massif'
   * @param {string} entityId - The identifier of the entity
   * @returns {Promise<Array>} List of non-deleted guidelines
   */
  getGuidelinesForEntity: async (entityType, entityId) => {
    let guidelineIds = [];
    if (entityType === 'country') {
      const country = await TCountry.findOne({ id: entityId }).populate(
        'guidelines'
      );
      if (country && country.guidelines) {
        guidelineIds = country.guidelines.map((g) => g.id);
      }
    } else if (entityType === 'region') {
      const region = await TISO31662.findOne({ id: entityId }).populate(
        'guidelines'
      );
      if (region && region.guidelines) {
        guidelineIds = region.guidelines.map((g) => g.id);
      }
    } else if (entityType === 'massif') {
      const numericId = parseInt(entityId, 10);
      if (!Number.isNaN(numericId)) {
        const massif = await TMassif.findOne({ id: numericId }).populate(
          'guidelines'
        );
        if (massif && massif.guidelines) {
          guidelineIds = massif.guidelines.map((g) => g.id);
        }
      }
    }

    if (guidelineIds.length === 0) return [];

    return TGuideline.find({ id: { in: guidelineIds }, isDeleted: false })
      .populate('author')
      .populate('reviewer')
      .populate('countries')
      .populate('regions')
      .populate('massifs');
  },

  /**
   * Fetch and group guidelines for an entrance (country, region, and associated cave's massifs).
   * @param {number|Object} entranceOrId - The ID of the entrance or the entrance object
   * @returns {Promise<Object|null>} Grouped guidelines or null if entrance not found
   */
  getGuidelinesForEntrance: async (entranceOrId) => {
    const entrance =
      typeof entranceOrId === 'object'
        ? entranceOrId
        : await TEntrance.findOne(entranceOrId);
    if (!entrance) return null;

    // 'country' may be a populated object (with .id) or a raw FK string depending on upstream population
    const countryCode = entrance.country?.id || entrance.country;
    const regionCode = entrance.iso_3166_2;
    // 'cave' may be a populated object (with .id) or a raw FK integer depending on upstream population
    const caveId = entrance.cave?.id || entrance.cave;

    const massifs = caveId ? await CaveService.getMassifs(caveId) : [];
    const massifIds = massifs.map((m) => m.id);

    const queryParts = [];
    const params = [];

    if (countryCode) {
      params.push(countryCode);
      queryParts.push(
        `SELECT id_guideline as id, 'country' as source FROM j_guideline_country WHERE id_country = $${params.length}`
      );
    }

    if (regionCode) {
      params.push(regionCode);
      queryParts.push(
        `SELECT id_guideline as id, 'region' as source FROM j_guideline_region WHERE id_region = $${params.length}`
      );
    }

    if (massifIds.length > 0) {
      // Pushing a JS array as a single param relies on the sails-postgresql
      // adapter serializing it to a PostgreSQL array literal for ANY($N::int[]).
      // This is adapter-specific behavior not guaranteed by Waterline, so
      // re-verify it if sails-postgresql is upgraded.
      params.push(massifIds);
      queryParts.push(
        `SELECT id_guideline as id, 'massif' as source FROM j_guideline_massif WHERE id_massif = ANY($${params.length}::int[])`
      );
    }

    if (queryParts.length === 0) {
      return { country: [], region: [], massif: [] };
    }

    const query = queryParts.join(' UNION ');
    const result = await sails.sendNativeQuery(query, params);

    const guidelineIds = [...new Set(result.rows.map((r) => r.id))];

    const guidelines =
      guidelineIds.length > 0
        ? await TGuideline.find({ id: { in: guidelineIds }, isDeleted: false })
            .populate('author')
            .populate('reviewer')
            .populate('countries')
            .populate('regions')
            .populate('massifs')
        : [];

    const guidelinesById = guidelines.reduce((acc, g) => {
      acc[g.id] = g;
      return acc;
    }, {});

    const grouped = { country: [], region: [], massif: [] };

    result.rows.forEach((row) => {
      const g = guidelinesById[row.id];
      if (g && !grouped[row.source].some((existing) => existing.id === g.id)) {
        grouped[row.source].push(g);
      }
    });

    return grouped;
  },

  /**
   * Fetch guidelines for all massifs associated with a cave.
   * Returns the same grouped shape as getGuidelinesForEntrance so the cave
   * converter can read source.guidelines.massif directly. Caves only carry
   * massif-level guidelines, so only the 'massif' group is populated.
   * @param {number} caveId - The ID of the cave
   * @returns {Promise<{massif: Array}>} Guidelines grouped under the 'massif' key
   */
  getGuidelinesForCave: async (caveId) => {
    const massifs = await CaveService.getMassifs(caveId);
    const massifIds = massifs.map((m) => m.id);

    if (massifIds.length === 0) return { massif: [] };

    // getMassifs already returns the massif records, so resolve the linked
    // guideline ids straight from the junction table instead of re-fetching
    // the massifs to populate their guidelines (see getGuidelinesForEntrance).
    const result = await sails.sendNativeQuery(
      'SELECT DISTINCT id_guideline AS id FROM j_guideline_massif WHERE id_massif = ANY($1::int[])',
      [massifIds]
    );
    const guidelineIds = result.rows.map((r) => r.id);

    if (guidelineIds.length === 0) return { massif: [] };

    const guidelines = await TGuideline.find({
      id: { in: guidelineIds },
      isDeleted: false,
    })
      .populate('author')
      .populate('reviewer')
      .populate('countries')
      .populate('regions')
      .populate('massifs');

    return { massif: guidelines };
  },

  /**
   * Verify if the referenced entities exist.
   * @param {Array<string>} countryIds - List of country codes
   * @param {Array<string>} regionIds - List of region ISO codes
   * @param {Array<number>} massifIds - List of massif IDs
   * @returns {Promise<boolean>} True if all entities exist and are valid
   */
  resolveEntitiesExist: async (
    countryIds = [],
    regionIds = [],
    massifIds = []
  ) => {
    // Deduplicate before comparing against the DB count: a repeated id (e.g.
    // ['FR', 'FR']) collapses to a single row in the IN clause, which would
    // otherwise make the count mismatch and report a spurious "does not exist".
    if (countryIds && countryIds.length > 0) {
      const uniqueCountryIds = [...new Set(countryIds)];
      const count = await TCountry.count({ id: uniqueCountryIds });
      if (count !== uniqueCountryIds.length) return false;
    }
    if (regionIds && regionIds.length > 0) {
      const uniqueRegionIds = [...new Set(regionIds)];
      const count = await TISO31662.count({ id: uniqueRegionIds });
      if (count !== uniqueRegionIds.length) return false;
    }
    if (massifIds && massifIds.length > 0) {
      const uniqueMassifIds = [...new Set(massifIds)];
      const massifs = await TMassif.find({ id: uniqueMassifIds });
      if (massifs.length !== uniqueMassifIds.length) return false;
      if (massifs.some((m) => m.isDeleted)) return false;
    }
    return true;
  },
};
