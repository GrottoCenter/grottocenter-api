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
 * Soft-deleted comments must not reach this function: it does not read
 * `isDeleted` and will happily average a deleted rating in. Both callers filter
 * first — dbSync via the `is_deleted = false` default in api/dbSync/utils.js,
 * EntranceService.updateInSearch at its call site — and a third caller has to do
 * the same. The filter is deliberately left outside so this stays a pure
 * numeric aggregate over whatever set the caller decided counts. See #1823.
 *
 * @param {Array<Object>} nonDeletedComments - Comment objects, already filtered on !isDeleted
 * @returns {{ aestheticism: number|null, caving: number|null, approach: number|null }}
 */
function computeCommentsRating(nonDeletedComments) {
  const rated = (field) =>
    average(nonDeletedComments.map((c) => c[field]).filter(filterPositive));

  return {
    aestheticism: rated('aestheticism'),
    caving: rated('caving'),
    approach: rated('approach'),
  };
}

module.exports = { average, filterPositive, computeCommentsRating };
