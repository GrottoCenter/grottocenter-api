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

/**
 * Compute the last modification date for an entrance.
 * @param {number} dateInscription - Epoch milliseconds of inscription date
 * @param {number|null|undefined} dateReviewed - Epoch milliseconds of review date, or nullish
 * @returns {number} Epoch milliseconds of the most recent modification
 */
function computeDateLastModif(dateInscription, dateReviewed) {
  return Math.max(dateInscription, dateReviewed ?? dateInscription);
}

module.exports = { NON_INDEXED_BOOLEAN_FIELDS, computeDateLastModif };
