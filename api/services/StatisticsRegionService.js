const GET_NB_MASSIFS = `
  SELECT COUNT(*) as nb_massifs
  FROM (
    SELECT DISTINCT id_massif
    FROM v_region_info
    WHERE id_region = $1) as tmp
`;

const GET_NB_CAVES = `
  SELECT COUNT(*) as nb_caves
  FROM (
    SELECT DISTINCT id_cave
    FROM v_region_info
    WHERE id_region = $1) as tmp
`;

const GET_NB_NETWORKS = `
  SELECT COUNT(*) as nb_networks
  FROM (
    SELECT DISTINCT id_cave
    FROM v_region_info
    WHERE id_region = $1
    AND nb_entrances > 1) as tmp
`;

const FIND_CAVE_WITH_MAX_DEPTH_IN_REGION = `
  SELECT id_cave, name_cave, depth_cave as value
  FROM v_region_info
  WHERE id_region = $1
  AND depth_cave IS NOT NULL
  ORDER BY depth_cave DESC
  LIMIT 1
`;

const FIND_CAVE_WITH_MAX_LENGTH_IN_REGION = `
  SELECT id_cave, name_cave, length_cave as value
  FROM v_region_info
  WHERE id_region = $1
  AND length_cave IS NOT NULL
  ORDER BY length_cave DESC
  LIMIT 1
`;

const GET_NB_CAVES_WHICH_ARE_DIVING_IN_REGION = `
  SELECT COUNT(*) as nb_diving_cave
  FROM (
    SELECT DISTINCT id_cave
    FROM v_region_info
    WHERE id_region = $1
    AND is_diving_cave = true) as tmp
`;

const GET_AVG_DEPTH_AND_LENGTH_IN_REGION = `
  SELECT AVG(depth_cave) as avg_depth, AVG(length_cave) as avg_length
  FROM (
    SELECT DISTINCT id_cave, depth_cave, length_cave
    FROM v_region_info
    WHERE id_region = $1) as tmp
`;

const GET_TOTAL_LENGTH_IN_REGION = `
  SELECT SUM(length_cave) as value, COUNT(length_cave) as nb_data
  FROM (
    SELECT DISTINCT id_region, id_cave, depth_cave, length_cave
    FROM v_region_info
    WHERE id_region = $1
    AND length_cave IS NOT NULL) as tmp
`;

const CommonService = require('./CommonService');

async function queryFirstRow(sql, param) {
  const queryResult = await CommonService.query(sql, [param]);
  const result = queryResult.rows;
  if (result.length > 0) {
    return result[0];
  }
  return null;
}

module.exports = {
  /**
   *
   * @param {string} regionId ISO 3166-2 code
   * @returns {int} the number of massifs in the region, or null if no result
   */
  getNbMassifsInRegion: async (regionId) =>
    queryFirstRow(GET_NB_MASSIFS, regionId),

  /**
   *
   * @param {string} regionId ISO 3166-2 code
   * @returns {int} the number of caves in the region, or null if no result
   */
  getNbCavesInRegion: async (regionId) => queryFirstRow(GET_NB_CAVES, regionId),

  /**
   *
   * @param {string} regionId ISO 3166-2 code
   * @returns {int} the number of networks in the region, or null if no result
   */
  getNbNetworksInRegion: async (regionId) =>
    queryFirstRow(GET_NB_NETWORKS, regionId),

  /**
   *
   * @param {string} regionId ISO 3166-2 code
   * @returns {Object} the cave with the maximum depth in the region (id, name and depth),
   *                   or null if no result
   */
  getCaveWithMaxDepthInRegion: async (regionId) =>
    queryFirstRow(FIND_CAVE_WITH_MAX_DEPTH_IN_REGION, regionId),

  /**
   *
   * @param {string} regionId ISO 3166-2 code
   * @returns {Object} the cave with the maximum length in the region (id, name and length),
   *                   or null if no result
   */
  getCaveWithMaxLengthInRegion: async (regionId) =>
    queryFirstRow(FIND_CAVE_WITH_MAX_LENGTH_IN_REGION, regionId),

  /**
   *
   * @param {string} regionId ISO 3166-2 code
   * @returns {int} the number of caves which are diving in the region, or null if no result
   */
  getNbCavesWhichAreDivingInRegion: async (regionId) =>
    queryFirstRow(GET_NB_CAVES_WHICH_ARE_DIVING_IN_REGION, regionId),

  /**
   *
   * @param {string} regionId ISO 3166-2 code
   * @returns {Object} the average depth and length in the region, or null if no result
   */
  getAvgDepthAndLengthInRegion: async (regionId) =>
    queryFirstRow(GET_AVG_DEPTH_AND_LENGTH_IN_REGION, regionId),

  /**
   *
   * @param {string} regionId ISO 3166-2 code
   * @returns {int} the sum of the lengths of each cave in the region, or null if no result
   */
  getTotalLength: async (regionId) =>
    queryFirstRow(GET_TOTAL_LENGTH_IN_REGION, regionId),
};
