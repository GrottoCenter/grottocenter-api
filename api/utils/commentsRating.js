/**
 * Compute comment rating averages for search indexing.
 * Shared between dbSync (entrance entity) and EntranceService (real-time updates).
 */

function average(arr) {
  if (arr.length === 0) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

const filterPositive = (e) => e && e > 0;

/**
 * Compute the commentsRating aggregate from an array of comment objects.
 * Each comment is expected to have { aestheticism, caving, approach } numeric fields.
 *
 * @param {Array<Object>} comments - Array of comment objects
 * @returns {{ aestheticism: number|null, caving: number|null, approach: number|null }}
 */
function computeCommentsRating(comments) {
  return {
    aestheticism: average(
      comments.map((c) => c.aestheticism).filter(filterPositive)
    ),
    caving: average(comments.map((c) => c.caving).filter(filterPositive)),
    approach: average(comments.map((c) => c.approach).filter(filterPositive)),
  };
}

module.exports = { average, filterPositive, computeCommentsRating };
