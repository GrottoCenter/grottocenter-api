const FIND_MASSIF_IN_VIEW = `
  SELECT *
  FROM v_massif_info
  WHERE id_massif = $1
`;

const GET_NB_CAVES = `
  SELECT COUNT(*) as nb_caves
  FROM v_massif_info
  WHERE id_massif = $1
`;

const GET_NB_NETWORKS = `
  SELECT COUNT(*) as nb_networks
  FROM v_massif_info
  WHERE id_massif = $1
  AND nb_entrances > 1
`;

const FIND_CAVE_WITH_MAX_DEPTH_IN_MASSIF = `
  SELECT id_cave, name_cave, depth_cave as value
  FROM v_massif_info
  WHERE depth_cave IN (
    SELECT MAX(depth_cave)
    FROM v_massif_info
    WHERE id_massif = $1
    )
  AND id_massif = $1
`;

const FIND_CAVE_WITH_MAX_LENGTH_IN_MASSIF = `
  SELECT id_cave, name_cave, length_cave as value
  FROM v_massif_info
  WHERE length_cave IN (
    SELECT MAX(length_cave)
    FROM v_massif_info
    WHERE id_massif = $1
  )
  AND id_massif = $1
  LIMIT 1
`;

const GET_NB_CAVES_WHICH_ARE_DIVING_IN_MASSIF = `
  SELECT COUNT(*) as nb_diving_cave
  FROM v_massif_info
  WHERE is_diving_cave = true
  AND id_massif = $1
`;

const GET_AVG_DEPTH_AND_LENGTH_IN_MASSIF = `
  SELECT AVG(depth_cave) as avg_depth, AVG(length_cave) as avg_length
  FROM v_massif_info
  WHERE id_massif = $1 
`;

const GET_TOTAL_LENGTH_IN_MASSIF = `
  SELECT SUM(length_cave) as value, COUNT(length_cave) as nb_data
  FROM v_massif_info
  WHERE length_cave IS NOT NULL
  AND id_massif = $1
`;

const CommonService = require('./CommonService');

module.exports = {
  /**
   *
   * @param {int} massifId
   * @returns {boolean} true if there is some line about this massif, else false
   */
  isMassifInView: async (massifId) => {
    try {
      const queryResult = await CommonService.query(FIND_MASSIF_IN_VIEW, [
        massifId,
      ]);
      const result = queryResult.rows;
      if (result.length > 0) {
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  /**
   *
   * @param {int} massifId
   * @returns {int} the number of caves in the massif
   *                or null if no result or something went wrong
   */
  getNbCavesInMassif: async (massifId) => {
    try {
      const queryResult = await CommonService.query(GET_NB_CAVES, [massifId]);
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
   * @param {int} massifId
   * @returns {int} the number of networks in the massif
   *                or null if no result or something went wrong
   */
  getNbNetworksInMassif: async (massifId) => {
    try {
      const queryResult = await CommonService.query(GET_NB_NETWORKS, [
        massifId,
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
   * @param {int} massifId
   * @returns {Object} the cave with the maximum depth in the massif (id, name and depth)
   *                or null if no result or something went wrong
   */
  getCaveWithMaxDepthInMassif: async (massifId) => {
    try {
      const queryResult = await CommonService.query(
        FIND_CAVE_WITH_MAX_DEPTH_IN_MASSIF,
        [massifId]
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
   * @param {int} massifId
   * @returns {Object} the cave with the maximum length in the massif (id, name and length)
   *                or null if no result or something went wrong
   */
  getCaveWithMaxLengthInMassif: async (massifId) => {
    try {
      const queryResult = await CommonService.query(
        FIND_CAVE_WITH_MAX_LENGTH_IN_MASSIF,
        [massifId]
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
   * @param {int} massifId
   * @returns {int} the number of caves which are diving in the massif
   *                or null if no result or something went wrong
   */
  getNbCavesWhichAreDivingInMassif: async (massifId) => {
    try {
      const queryResult = await CommonService.query(
        GET_NB_CAVES_WHICH_ARE_DIVING_IN_MASSIF,
        [massifId]
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
   * @param {int} massifId
   * @returns {Object} the average depth and length in the massif
   *                or null if no result or something went wrong
   */
  getAvgDepthAndLengthInMassif: async (massifId) => {
    try {
      const queryResult = await CommonService.query(
        GET_AVG_DEPTH_AND_LENGTH_IN_MASSIF,
        [massifId]
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
   * @param {int} massifId
   * @returns {int} the sum of the lengths of each cave in the massif
   *                or null if no result or something went wrong
   */
  getTotalLength: async (massifId) => {
    try {
      const queryResult = await CommonService.query(
        GET_TOTAL_LENGTH_IN_MASSIF,
        [massifId]
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
