/**
 * EnumService
 *
 * Central place for the public enumeration / reference tables used by the
 * scientific observation domain. Owns the query + response mapping for the six
 * lookup tables so their shape lives in one place.
 *
 * Immutable reference data — memoized at module level. The rows only change via database migrations shipped with a deploy, so
 * a process restart refreshes the cache; within a process lifetime repeated
 * requests are served from memory without re-querying the database.
 *
 * Deliberately unpaginated, unlike the entity list endpoints asks to
 * paginate: these are small bounded vocabularies a client needs in full to
 * label a form, and the existing reference endpoints (licenses, file-formats,
 * identifier-types) return their whole list too.
 */

const cache = {};

// Concepts sharing the { id, code, url } shape (media, observation types,
// human activity types, contaminant types).
const mapConcept = (r) => ({ id: r.id, code: r.code, url: r.url });

module.exports = {
  getCacheMaxAge: () => sails.config.custom.enumsCacheMaxAge ?? 86400,

  getQuantityKinds: async () => {
    if (!cache.quantityKinds) {
      const rows = await TQuantityKind.find().populate('displayUnit');
      cache.quantityKinds = rows.map((r) => ({
        id: r.id,
        code: r.code,
        url: r.url,
        symbolSi: r.symbolSi,
        displayUnit: r.displayUnit
          ? {
              id: r.displayUnit.id,
              code: r.displayUnit.code,
              symbol: r.displayUnit.symbol,
            }
          : null,
      }));
    }
    return cache.quantityKinds;
  },

  getUnits: async () => {
    if (!cache.units) {
      const rows = await TUnit.find();
      cache.units = rows.map((r) => ({
        id: r.id,
        code: r.code,
        symbol: r.symbol,
        dimension: r.dimension,
        // Strings — preserve PostgreSQL numeric precision (see TUnit model).
        siToDisplayFactor: r.siToDisplayFactor,
        siToDisplayOffset: r.siToDisplayOffset,
      }));
    }
    return cache.units;
  },

  getMedia: async () => {
    if (!cache.media) {
      cache.media = (await TMedium.find()).map(mapConcept);
    }
    return cache.media;
  },

  getObservationTypes: async () => {
    if (!cache.observationTypes) {
      cache.observationTypes = (await TObservationType.find()).map(mapConcept);
    }
    return cache.observationTypes;
  },

  getHumanActivityTypes: async () => {
    if (!cache.humanActivityTypes) {
      cache.humanActivityTypes = (await THumanActivityType.find()).map(
        mapConcept
      );
    }
    return cache.humanActivityTypes;
  },

  getContaminantTypes: async () => {
    if (!cache.contaminantTypes) {
      cache.contaminantTypes = (await TContaminantType.find()).map(mapConcept);
    }
    return cache.contaminantTypes;
  },
};
