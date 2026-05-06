/**
 * LanguageService.js
 *
 * @description :: Shared helpers for language/locale resolution.
 */

module.exports = {
  /**
   * Resolve a TLanguage FK id to an ISO 639-1 locale code (e.g. "fr", "en").
   *
   * @param {string|number|null|undefined} languageId - The TLanguage id (ISO 639-3 code or numeric FK)
   * @returns {Promise<string|undefined>} The ISO 639-1 part1 code, or undefined if not resolvable
   */
  getLocale: async (languageId) => {
    if (!languageId) return undefined;
    const lang = await TLanguage.findOne({ id: languageId });
    if (lang && lang.part1) {
      return lang.part1;
    }
    return undefined;
  },
};
