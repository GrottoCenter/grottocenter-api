/**
 * Normalizes the `dataQuality` filter for advanced search.
 *
 * Handles the following formats:
 * - [min, max] — both bounds specified
 * - [min, null] or [min] — only minimum bound
 * - [null, max] — only maximum bound
 *
 * Behavior:
 * - Clamps values to 0–100
 * - Replaces null min with 0, null max with 100
 * - Removes the filter key if values are non-numeric
 *
 * @param {object} filter - The filter object from the request
 * @returns {object} A new filter object with normalized dataQuality (or without it)
 */
const normalizeDataQualityFilter = (filter) => {
  if (!filter || !Object.prototype.hasOwnProperty.call(filter, 'dataQuality')) {
    return filter;
  }

  const raw = filter.dataQuality;
  const arr = Array.isArray(raw) ? raw : [raw];

  const rawMin = arr[0];
  const rawMax = arr.length > 1 ? arr[1] : null;

  // Parse values — treat null/undefined as unbounded
  const parsedMin = rawMin != null ? Number(rawMin) : null;
  const parsedMax = rawMax != null ? Number(rawMax) : null;

  // If either parsed value is NaN (non-numeric, excluding null), remove the filter
  if (
    (parsedMin !== null && Number.isNaN(parsedMin)) ||
    (parsedMax !== null && Number.isNaN(parsedMax))
  ) {
    const { dataQuality, ...rest } = filter;
    return rest;
  }

  // Replace null bounds with defaults and clamp to [0, 100]
  const min = Math.max(0, Math.min(100, parsedMin ?? 0));
  const max = Math.max(0, Math.min(100, parsedMax ?? 100));

  return { ...filter, dataQuality: [min, max] };
};

module.exports = normalizeDataQualityFilter;
