const CommonService = require('./CommonService');

const NB_REGIONS_BY_COUNTRY = `
  SELECT COUNT(*)
  FROM (SELECT DISTINCT r.iso
        FROM t_iso3166_2 r
               JOIN t_entrance e ON e.iso_3166_2 = r.iso
        WHERE r.iso LIKE $1
          AND e.is_deleted = false) as tmp;
`;

module.exports = {
  /**
   *
   * @param {string} countryId alpha-2 code
   * @returns {int} the number of regions in the specified country
   *                or null if no result or something went wrong
   */
  getNbRegionsByCountry: async (countryId) => {
    try {
      const queryResult = await CommonService.query(NB_REGIONS_BY_COUNTRY, [
        `${countryId}-%`,
      ]);
      const result = queryResult.rows;
      if (result.length > 0) {
        return result[0];
      }
      return null;
    } catch (e) {
      return null;
    }
  },
};
