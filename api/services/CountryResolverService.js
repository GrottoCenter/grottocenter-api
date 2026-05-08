/**
 * CountryResolverService.js
 *
 * @description :: Synchronous offline country resolution using @rapideditor/country-coder.
 *   Resolves latitude/longitude to the most specific ISO alpha-2 country code
 *   that exists in the t_country table, without any network dependency.
 */

let countryCoder = null;

module.exports = {
  /** @type {Set<string>|null} Cached ISO codes from t_country */
  countryCache: null,

  /**
   * Load all ISO codes from t_country into an in-memory Set.
   * Called once at application startup from bootstrap.js.
   */
  async loadCache() {
    const countries = await TCountry.find().select(['id']);
    this.countryCache = new Set(countries.map((c) => c.id));
    sails.log.info(
      `CountryResolverService: loaded ${this.countryCache.size} country codes into cache`
    );

    // Dynamically import the ESM-only country-coder package
    if (!countryCoder) {
      countryCoder = await import('@rapideditor/country-coder');
    }
  },

  /**
   * Get features containing a point. Wrapper around country-coder's
   * featuresContaining() to allow stubbing in tests.
   *
   * @param {Array} lonLat - [longitude, latitude]
   * @param {boolean} ordered - if true, returns most-specific first
   * @returns {Array} array of GeoJSON features
   */
  getFeaturesContaining(lonLat, ordered) {
    if (!countryCoder) return [];
    return countryCoder.featuresContaining(lonLat, ordered);
  },

  /**
   * Resolve latitude/longitude to the most specific id_country
   * that exists in the t_country table.
   *
   * Uses hierarchy-based resolution: walks from most-specific territory
   * (e.g., RE for Réunion) to least-specific sovereign (e.g., FR),
   * returning the first code found in the cache.
   *
   * @param {number|string} latitude
   * @param {number|string} longitude
   * @returns {string} ISO alpha-2 code or '00'
   */
  resolve(latitude, longitude) {
    if (!this.countryCache) return '00';

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (Number.isNaN(lat) || Number.isNaN(lon)) return '00';

    // Get all features containing this point, ordered most-specific first
    const features = this.getFeaturesContaining([lon, lat], true);

    // Walk from most specific to least specific
    for (const feat of features) {
      const { properties: props } = feat;
      const code = props.iso1A2;
      if (code && this.countryCache.has(code)) {
        return code;
      }
    }

    // Fallback: undetermined
    return '00';
  },
};
