/**
 * TemporalNameResolver — pure functions for temporal name resolution
 * in the entrance snapshot timeline.
 *
 * All functions are pure (no DB calls). Data is passed in as arguments.
 */

/* eslint-disable no-param-reassign */

/**
 * Resolve the name valid at a given snapshot date.
 *
 * The algorithm finds the h_name record whose date_reviewed is the smallest
 * value still greater than snapshotDate. That record's `name` was the one
 * active at snapshotDate (it was superseded after snapshotDate).
 *
 * @param {Date|string} snapshotDate - The date_reviewed of the snapshot
 * @param {Array} hNameRecords - All h_name records for the entity (pre-filtered to is_main=true)
 * @param {string|null} currentName - The current TName main name (fallback)
 * @returns {string} The resolved name, or '' if none found
 */
const resolveNameAtDate = (snapshotDate, hNameRecords, currentName) => {
  const snapshotTime = new Date(snapshotDate).getTime();

  const futureRecords = (hNameRecords || [])
    .filter((r) => new Date(r.dateReviewed).getTime() > snapshotTime)
    .sort(
      (a, b) =>
        new Date(a.dateReviewed).getTime() - new Date(b.dateReviewed).getTime()
    );

  if (futureRecords.length > 0) {
    return futureRecords[0].name;
  }

  if (currentName) {
    return currentName;
  }

  return '';
};

/**
 * Resolve cave names for multiple HEntrance snapshots.
 * Pure function — all DB data is passed in as arguments.
 *
 * @param {Array} hEntrances - HEntrance snapshot objects (each with a `cave` field: number or object)
 * @param {Map<number, Array>} caveHNameMap - Map of caveId → array of h_name records (is_main=true)
 * @param {Map<number, string>} currentCaveNameMap - Map of caveId → current TName main name
 * @returns {Array} The same hEntrances array with `caveName` set on each entry
 */
const resolveCaveNamesForSnapshots = (
  hEntrances,
  caveHNameMap,
  currentCaveNameMap
) => {
  hEntrances.forEach((entrance) => {
    const caveId = entrance.cave?.id ?? entrance.cave;

    if (!caveId) {
      entrance.caveName = null;
      return;
    }

    const caveHNames = caveHNameMap.get(caveId) || [];
    const currentCaveName = currentCaveNameMap.get(caveId) || null;

    entrance.caveName = resolveNameAtDate(
      entrance.id,
      caveHNames,
      currentCaveName
    );
  });

  return hEntrances;
};

/**
 * Filter h_name records to only those representing actual name changes.
 *
 * When a t_name row is updated for reasons other than a name change (e.g.
 * date_reviewed is bumped by an unrelated edit), the trigger still copies
 * the old row to h_name. This produces many h_name rows with the same name
 * in sequence. This function keeps only the records where the name differs
 * from the subsequent value in the timeline.
 *
 * @param {Array} hNameRecords - h_name records (need not be pre-sorted)
 * @param {string|null} currentName - The current TName main name (the latest value).
 *   Treated as empty string when null/undefined for comparison purposes.
 * @returns {Array} Filtered records where name actually changed
 */
const filterToActualNameChanges = (hNameRecords, currentName) => {
  if (!hNameRecords || hNameRecords.length === 0) return [];

  // Sort defensively — callers may pass pre-sorted data but this function
  // must not depend on caller ordering guarantees.
  const sorted = [...hNameRecords].sort(
    (a, b) =>
      new Date(a.dateReviewed).getTime() - new Date(b.dateReviewed).getTime()
  );

  const effectiveCurrentName = currentName || '';
  const result = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const nextName =
      i < sorted.length - 1 ? sorted[i + 1].name : effectiveCurrentName;
    if (sorted[i].name !== nextName) {
      result.push(sorted[i]);
    }
  }
  return result;
};

/**
 * Build Name_Change_Snapshot objects from h_name records.
 *
 * @param {number} entranceId - The entrance ID
 * @param {Array} hNameRecords - h_name records with is_main=true for the entrance
 * @param {Function} resolveCaveNameFn - Function(snapshotDate) to resolve caveName for each synthetic snapshot
 * @returns {Array} Array of synthetic snapshot objects
 */
const buildNameChangeSnapshots = (
  entranceId,
  hNameRecords,
  resolveCaveNameFn
) =>
  (hNameRecords || []).map((record) => ({
    id: record.dateReviewed,
    t_id:
      typeof entranceId === 'string' ? parseInt(entranceId, 10) : entranceId,
    name: record.name,
    author: record.author,
    reviewer: record.reviewer,
    dateInscription: record.dateInscription,
    dateReviewed: record.dateReviewed,
    caveName: resolveCaveNameFn(record.dateReviewed),
    cave: null,
    latitude: null,
    longitude: null,
    altitude: null,
    isSensitive: false,
    isDeleted: false,
    names: [],
    isNameChangeSnapshot: true,
  }));

/**
 * Merge HEntrance snapshots with name-change snapshots, sorted chronologically.
 * Uses Date parsing for comparison to avoid timezone-dependent string sort issues.
 *
 * @param {Array} hEntrances - HEntrance snapshot objects
 * @param {Array} nameChangeSnapshots - Synthetic name-change snapshot objects
 * @returns {Array} Merged and sorted array
 */
const mergeAndSort = (hEntrances, nameChangeSnapshots) =>
  [...(hEntrances || []), ...(nameChangeSnapshots || [])].sort(
    (a, b) => new Date(a.id).getTime() - new Date(b.id).getTime()
  );

module.exports = {
  resolveNameAtDate,
  resolveCaveNamesForSnapshots,
  filterToActualNameChanges,
  buildNameChangeSnapshots,
  mergeAndSort,
};
