/**
 * LanguageService.js
 *
 * @description :: Shared helpers for language/locale resolution.
 */

// In-memory cache for locale lookups. Languages are static data that never
// change at runtime, so no TTL or invalidation is needed.
const localeCache = new Map();

module.exports = {
  /**
   * Resolve a TLanguage FK id to an ISO 639-1 locale code (e.g. "fr", "en").
   *
   * @param {string|number|null|undefined} languageId - The TLanguage id (ISO 639-3 code or numeric FK)
   * @returns {Promise<string|undefined>} The ISO 639-1 part1 code, or undefined if not resolvable
   */
  getLocale: async (languageId) => {
    if (!languageId) return undefined;
    if (localeCache.has(languageId)) return localeCache.get(languageId);
    const lang = await TLanguage.findOne({ id: languageId });
    // Guard against empty string: part1 can be '' for languages without an
    // ISO 639-1 code, in which case we want to return undefined, not ''.
    const locale = lang?.part1 || undefined;
    localeCache.set(languageId, locale);
    return locale;
  },
};
