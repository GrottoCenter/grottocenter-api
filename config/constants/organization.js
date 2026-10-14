/**
 * Organization type constants.
 *
 * The values match the t_grotto_type_check constraint in
 * sql/9_23_2026_10_15_organization_type.sql. Their labels are translated by
 * the front end.
 */

const ORGANIZATION_TYPES = Object.freeze({
  SPELEOLOGY: 'SPELEOLOGY', // https://www.wikidata.org/wiki/Q179132
  CAVE_RESCUE: 'CAVE_RESCUE', // https://www.wikidata.org/wiki/Q1643871
  EDITION: 'EDITION', // https://www.wikidata.org/wiki/Q57933693
  RESEARCH: 'RESEARCH', // https://www.wikidata.org/wiki/Q42240
  ADMINISTRATION: 'ADMINISTRATION', // https://www.wikidata.org/wiki/Q31728
  NATURE_CONSERVATION: 'NATURE_CONSERVATION', // https://www.wikidata.org/wiki/Q20113959
  LIBRARY: 'LIBRARY', // https://www.wikidata.org/wiki/Q7075
});

const ORGANIZATION_TYPE_VALUES = Object.freeze(
  Object.values(ORGANIZATION_TYPES)
);

// Type given to an organization created without one. Organizations that
// existed before types were introduced keep a NULL type until they are edited.
const DEFAULT_ORGANIZATION_TYPE = ORGANIZATION_TYPES.SPELEOLOGY;

// Types shown on the map, alongside the organizations whose type is not set
// yet: a publisher or a library has no business there.
const MAP_ORGANIZATION_TYPES = Object.freeze([
  ORGANIZATION_TYPES.SPELEOLOGY,
  ORGANIZATION_TYPES.CAVE_RESCUE,
]);

module.exports = {
  ORGANIZATION_TYPES,
  ORGANIZATION_TYPE_VALUES,
  DEFAULT_ORGANIZATION_TYPE,
  MAP_ORGANIZATION_TYPES,
};
