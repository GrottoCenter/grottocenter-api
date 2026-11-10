const CommonService = require('./CommonService');

const NB_COUNTRIES = `
  SELECT COUNT(*)
  FROM (SELECT DISTINCT id_country
        FROM t_country c
               JOIN t_entrance e ON e.id_country = c.iso
        WHERE e.is_deleted = false) as tmp;
`;

// Every country with its number of non-deleted entrances, 0 included, in one
// grouped query. '00' is the placeholder of entrances with no known country,
// not a country. Same predicate as StatisticsCountryService.getNbEntrancesInCountry.
const ENTRANCE_COUNTS_BY_COUNTRY = `
  SELECT c.iso AS id, COUNT(e.id) AS nb_entrances
  FROM t_country c
         LEFT JOIN t_entrance e ON e.id_country = c.iso
    AND e.is_deleted = false
  WHERE c.iso <> '00'
  GROUP BY c.iso
  ORDER BY c.iso;
`;

module.exports = {
  /**
   *
   * @param
   * @returns {int} the number of countries in the database (a country is counted if it is associated with at least one entrance)
   *                or null if no result or something went wrong
   */
  getNbCountries: async () => {
    try {
      const queryResult = await CommonService.query(NB_COUNTRIES, []);
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
   * @returns {Promise<Array<{id: string, nb_entrances: number}>>} every
   *          country (ISO 3166-1 alpha-2) with its number of non-deleted
   *          entrances, sorted by id
   */
  getEntranceCountsByCountry: async () => {
    const { rows } = await CommonService.query(ENTRANCE_COUNTS_BY_COUNTRY, []);
    return rows.map((row) => ({
      id: row.id,
      nb_entrances: Number.parseInt(row.nb_entrances, 10),
    }));
  },
};
