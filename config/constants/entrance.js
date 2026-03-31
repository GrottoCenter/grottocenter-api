/**
 * Boolean characteristic fields on entrances that are NOT indexed in Typesense.
 * Used to strip them from search documents in both updateInSearch and dbSync importFormater.
 */
const NON_INDEXED_BOOLEAN_FIELDS = [
  'hasBat',
  'dangerFlooding',
  'dangerCo2',
  'dangerRockfall',
  'needCleanGear',
  'needStayOnTrail',
  'hasRules',
];

module.exports = { NON_INDEXED_BOOLEAN_FIELDS };
