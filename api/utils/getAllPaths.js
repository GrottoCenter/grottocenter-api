/**
 * Recursive function. Ignore case of obj keys and match "endsWith" keys (ex: "entrances" will match "exploredEntrances"))
 * Taken from https://stackoverflow.com/questions/60352470/get-all-paths-to-a-specific-key-in-a-deeply-nested-object
 * @param {*} obj
 * @param {String} searchedKey
 * @param {String} prev
 */
const getAllPaths = (obj, searchedKey, prev = '') => {
  const result = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const path = prev + (prev ? '.' : '') + key;
      // use toLowerCase() to match property like "exploredEntrances" for the key "entrances"
      if (key.toLowerCase().endsWith(searchedKey)) {
        result.push(path);
      } else if (typeof obj[key] === 'object') {
        result.push(...getAllPaths(obj[key], searchedKey, path));
      }
    }
  }
  return result;
};

module.exports = getAllPaths;
