const parseBool = require('./parseBool');

/**
 * Normalizes a boolean entry of a search filter, such as `hasFiles` (#1739).
 *
 * Typesense only filters a bool field on a bare `true` / `false`, while
 * SearchService quotes any string value: `'true'` sent by a client that
 * stringifies its body would make Typesense reject the whole search. The value
 * is read with parseBool, so the accepted encodings match readBoolParam.
 *
 * - `true` / `'true'` / `'1'` → `true`; `false` / `'false'` / `'0'` → `false`
 * - absent, `null` or `''` → the key is removed (no filtering)
 * - anything else → `{ error }`, naming the field as `filter.<name>`
 *
 * @param {object} filter - The filter object from the request
 * @param {string} name - The boolean filter key
 * @returns {{ filter: object } | { error: { field: string, value: * } }}
 *   A new filter object, or the invalid field and value
 */
const normalizeBoolFilter = (filter, name) => {
  if (!filter || typeof filter !== 'object' || !Object.hasOwn(filter, name)) {
    return { filter };
  }

  const raw = filter[name];
  const value = parseBool(raw);
  if (value === parseBool.INVALID) {
    return { error: { field: `filter.${name}`, value: raw } };
  }
  if (value === undefined) {
    const { [name]: omitted, ...rest } = filter;
    return { filter: rest };
  }
  return { filter: { ...filter, [name]: value } };
};

module.exports = normalizeBoolFilter;
