const NB_COUNTRIES = `
SELECT COUNT(*)
FROM (
    SELECT DISTINCT id_country
    FROM t_country c
    JOIN t_entrance e ON e.id_country = c.iso
    WHERE e.is_deleted = false) as tmp;
`;

const CommonService = require('./CommonService');

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
};
