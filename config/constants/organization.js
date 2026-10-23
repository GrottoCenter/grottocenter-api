/**
 * Organization type constants.
 *
 * The values match the t_grotto_type_check constraint, created by
 * sql/9_23_2026_10_15_organization_type.sql and extended with OTHER by
 * sql/9_26_2026_10_22_organization_type_other.sql. Their labels are translated
 * by the front end. A new organization must be given one; only the
 * organizations registered before types were introduced have a NULL type.
 * OTHER is a deliberate classification ("none of the categories apply"), not
 * a stand-in for that NULL.
 */

const ORGANIZATION_TYPES = Object.freeze({
  SPELEOLOGY: 'SPELEOLOGY', // https://www.wikidata.org/wiki/Q179132
  CAVE_RESCUE: 'CAVE_RESCUE', // https://www.wikidata.org/wiki/Q1643871
  EDITION: 'EDITION', // https://www.wikidata.org/wiki/Q57933693
  RESEARCH: 'RESEARCH', // https://www.wikidata.org/wiki/Q42240
  ADMINISTRATION: 'ADMINISTRATION', // https://www.wikidata.org/wiki/Q31728
  NATURE_CONSERVATION: 'NATURE_CONSERVATION', // https://www.wikidata.org/wiki/Q20113959
  LIBRARY: 'LIBRARY', // https://www.wikidata.org/wiki/Q7075
  OTHER: 'OTHER', // none of the categories above (#1923)
});

const ORGANIZATION_TYPE_VALUES = Object.freeze(
  Object.values(ORGANIZATION_TYPES)
);

// Types shown on the map, alongside the organizations whose type is not set
// yet: a publisher or a library has no business there.
const MAP_ORGANIZATION_TYPES = Object.freeze([
  ORGANIZATION_TYPES.SPELEOLOGY,
  ORGANIZATION_TYPES.CAVE_RESCUE,
]);

module.exports = {
  ORGANIZATION_TYPES,
  ORGANIZATION_TYPE_VALUES,
  MAP_ORGANIZATION_TYPES,
};
