const CommonService = require('./CommonService');

const NB_REGIONS_BY_COUNTRY = `
  SELECT COUNT(*)
  FROM (SELECT DISTINCT r.iso
        FROM t_iso3166_2 r
               JOIN t_entrance e ON e.iso_3166_2 = r.iso
        WHERE r.iso LIKE $1
          AND e.is_deleted = false) as tmp;
`;

// Every ISO 3166-2 subdivision of a country with its number of non-deleted
// entrances, 0 included, in one grouped query. Same predicate as
// StatisticsRegionService.getNbEntrancesInRegion.
const ENTRANCE_COUNTS_BY_REGION_OF_COUNTRY = `
  SELECT r.iso AS id, r.name, COUNT(e.id) AS nb_entrances
  FROM t_iso3166_2 r
         LEFT JOIN t_entrance e ON e.iso_3166_2 = r.iso
    AND e.is_deleted = false
  WHERE r.iso LIKE $1
  GROUP BY r.iso, r.name
  ORDER BY r.iso;
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

  /**
   * Sensitive entrances are counted: the figure does not depend on the
   * caller's rights and reveals no location.
   *
   * @param {string} countryId alpha-2 code
   * @returns {Promise<Array<{id: string, name: string, nb_entrances: number}>>}
   *          every region (ISO 3166-2 code) of the country with its number of
   *          non-deleted entrances, sorted by id; empty if it has none
   */
  getEntranceCountsByCountry: async (countryId) => {
    const { rows } = await CommonService.query(
      ENTRANCE_COUNTS_BY_REGION_OF_COUNTRY,
      [`${countryId}-%`]
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      nb_entrances: Number.parseInt(row.nb_entrances, 10),
    }));
  },
};
