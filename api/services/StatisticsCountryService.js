const FIND_COUNTRY_IN_VIEW = `
  SELECT *
  FROM v_country_info
  WHERE id_country = $1
`;

const GET_NB_MASSIFS = `
  SELECT COUNT(*) as nb_massifs
  FROM (
    SELECT DISTINCT id_massif
    FROM v_country_info
    WHERE id_country = $1) as tmp
`;

const GET_NB_CAVES = `
  SELECT COUNT(*) as nb_caves
  FROM (
    SELECT DISTINCT id_cave
    FROM v_country_info
    WHERE id_country = $1) as tmp;
`;

const GET_NB_NETWORKS = `
  SELECT COUNT(*) as nb_networks
  FROM (
    SELECT DISTINCT id_cave
    FROM v_country_info
    WHERE id_country = $1
    AND nb_entrances > 1) as tmp;
`;

const FIND_CAVE_WITH_MAX_DEPTH_IN_COUNTRY = `
  SELECT id_cave, name_cave, depth_cave as value
  FROM v_country_info
  WHERE id_country = $1
  AND depth_cave IS NOT NULL
  ORDER BY depth_cave DESC
  LIMIT 1
`;

const FIND_CAVE_WITH_MAX_LENGTH_IN_COUNTRY = `
  SELECT id_cave, name_cave, length_cave as value
  FROM v_country_info
  WHERE id_country = $1
  AND length_cave IS NOT NULL
  ORDER BY length_cave DESC
  LIMIT 1
`;

const GET_NB_CAVES_WHICH_ARE_DIVING_IN_COUNTRY = `
  SELECT COUNT(*) as nb_diving_cave
  FROM (
    SELECT DISTINCT id_cave
    FROM v_country_info
    WHERE id_country = $1
    AND is_diving_cave = true) as tmp;
`;

const GET_AVG_DEPTH_AND_LENGTH_IN_COUNTRY = `
  SELECT AVG(depth_cave) as avg_depth, AVG(length_cave) as avg_length
  FROM (
    SELECT DISTINCT id_cave, depth_cave, length_cave
    FROM v_country_info
    WHERE id_country = $1) as tmp;
`;

const GET_TOTAL_LENGTH_IN_COUNTRY = `
  SELECT SUM(length_cave) as value, COUNT(length_cave) as nb_data
  FROM (
    SELECT DISTINCT id_country, id_cave, depth_cave, length_cave
    FROM v_country_info
    WHERE id_country = $1
    AND length_cave IS NOT NULL) as tmp
`;

const CommonService = require('./CommonService');

module.exports = {
  /**
   *
   * @param {int} countryId
   * @returns {boolean} true if there is some line about this country, else false
   */
  isCountryInView: async (countryId) => {
    try {
      const queryResult = await CommonService.query(FIND_COUNTRY_IN_VIEW, [
        countryId,
      ]);
      const result = queryResult.rows;
      return result.length > 0;
    } catch (e) {
      return false;
    }
  },

  /**
   *
   * @param {string} countryId
   * @returns {int} the number of massifs in the country
   *                or null if no result or something went wrong
   */
  getNbMassifsInCountry: async (countryId) => {
    try {
      const queryResult = await CommonService.query(GET_NB_MASSIFS, [
        countryId,
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
   *
   * @param {string} countryId
   * @returns {int} the number of caves in the country
   *                or null if no result or something went wrong
   */
  getNbCavesInCountry: async (countryId) => {
    try {
      const queryResult = await CommonService.query(GET_NB_CAVES, [countryId]);
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
   *
   * @param {string} countryId
   * @returns {int} the number of networks in the country
   *                or null if no result or something went wrong
   */
  getNbNetworksInCountry: async (countryId) => {
    try {
      const queryResult = await CommonService.query(GET_NB_NETWORKS, [
        countryId,
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
   *
   * @param {string} countryId
   * @returns {Object} the cave with the maximum depth in the country (id, name and depth)
   *                or null if no result or something went wrong
   */
  getCaveWithMaxDepthInCountry: async (countryId) => {
    try {
      const queryResult = await CommonService.query(
        FIND_CAVE_WITH_MAX_DEPTH_IN_COUNTRY,
        [countryId]
      );
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
   *
   * @param {string} countryId
   * @returns {Object} the cave with the maximum length in the country (id, name and length)
   *                or null if no result or something went wrong
   */
  getCaveWithMaxLengthInCountry: async (countryId) => {
    try {
      const queryResult = await CommonService.query(
        FIND_CAVE_WITH_MAX_LENGTH_IN_COUNTRY,
        [countryId]
      );
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
   *
   * @param {string} countryId
   * @returns {int} the number of caves which are diving in the country
   *                or null if no result or something went wrong
   */
  getNbCavesWhichAreDivingInCountry: async (countryId) => {
    try {
      const queryResult = await CommonService.query(
        GET_NB_CAVES_WHICH_ARE_DIVING_IN_COUNTRY,
        [countryId]
      );
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
   *
   * @param {string} countryId
   * @returns {Object} the average depth and length in the country
   *                or null if no result or something went wrong
   */
  getAvgDepthAndLengthInCountry: async (countryId) => {
    try {
      const queryResult = await CommonService.query(
        GET_AVG_DEPTH_AND_LENGTH_IN_COUNTRY,
        [countryId]
      );
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
   *
   * @param {string} countryId
   * @returns {int} the sum of the lengths of each cave in the country
   *                or null if no result or something went wrong
   */
  getTotalLength: async (countryId) => {
    try {
      const queryResult = await CommonService.query(
        GET_TOTAL_LENGTH_IN_COUNTRY,
        [countryId]
      );
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
