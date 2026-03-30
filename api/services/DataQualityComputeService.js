const CommonService = require('./CommonService');

/**
 * this service is used to retrieves the elements included
 * in the computation of the quality of the data of an entrance.
 */
const GET_ENTRANCES_WITH_QUALITY_BY_MASSIF = `
  SELECT *
  FROM v_data_quality_compute_entrance
  WHERE id_massif = $1
  LIMIT $2 OFFSET $3
`;

const GET_ENTRANCES_WITH_QUALITY_BY_COUNTRY = `
  SELECT DISTINCT id_entrance, general_latest_date_of_update, general_nb_contributions, location_latest_date_of_update, location_nb_contributions, description_latest_date_of_update, description_nb_contributions, document_latest_date_of_update, document_nb_contributions, rigging_latest_date_of_update, rigging_nb_contributions, history_latest_date_of_update, history_nb_contributions, comment_latest_date_of_update, comment_nb_contributions, entrance_name, id_country, country_name, date_of_update
  FROM v_data_quality_compute_entrance
  WHERE id_country = $1
  LIMIT $2 OFFSET $3
`;

const GET_ENTRANCES_WITH_QUALITY_BY_REGION = `
  SELECT DISTINCT v.id_entrance, v.general_latest_date_of_update, v.general_nb_contributions, v.location_latest_date_of_update, v.location_nb_contributions, v.description_latest_date_of_update, v.description_nb_contributions, v.document_latest_date_of_update, v.document_nb_contributions, v.rigging_latest_date_of_update, v.rigging_nb_contributions, v.history_latest_date_of_update, v.history_nb_contributions, v.comment_latest_date_of_update, v.comment_nb_contributions, v.entrance_name, v.id_country, v.country_name, v.date_of_update
  FROM v_data_quality_compute_entrance v
  JOIN t_entrance e ON v.id_entrance = e.id
  WHERE e.iso_3166_2 = $1
  LIMIT $2 OFFSET $3
`;

const COUNT_ENTRANCES_WITH_QUALITY_BY_MASSIF = `
  SELECT COUNT(*)
  FROM v_data_quality_compute_entrance
  WHERE id_massif = $1
`;

const COUNT_ENTRANCES_WITH_QUALITY_BY_COUNTRY = `
  SELECT COUNT(DISTINCT id_entrance)
  FROM v_data_quality_compute_entrance
  WHERE id_country = $1
`;

const COUNT_ENTRANCES_WITH_QUALITY_BY_REGION = `
  SELECT COUNT(DISTINCT v.id_entrance)
  FROM v_data_quality_compute_entrance v
  JOIN t_entrance e ON v.id_entrance = e.id
  WHERE e.iso_3166_2 = $1
`;

module.exports = {
  /**
   *
   * @param {int} massifId
   * @param {int} limit
   * @param {int} offset
   * @returns {Object} the date of the latest update and the number of contributions on all entrances in a massif
   *          or null if no result or something went wrong
   */
  getEntrancesWithQualityByMassif: async (
    massifId,
    limit = null,
    offset = null
  ) => {
    try {
      const params =
        limit !== null && offset !== null
          ? [massifId, limit, offset]
          : [massifId];
      const query =
        limit !== null && offset !== null
          ? GET_ENTRANCES_WITH_QUALITY_BY_MASSIF
          : GET_ENTRANCES_WITH_QUALITY_BY_MASSIF.replace(
              'LIMIT $2 OFFSET $3',
              ''
            );
      const queryResult = await CommonService.query(query, params);
      return queryResult.rows;
    } catch (e) {
      sails.log.error(e);
      return null;
    }
  },

  /**
   *
   * @param {int} massifId
   * @returns {int} count of entrances in massif
   */
  getEntrancesWithQualityByMassifCount: async (massifId) => {
    try {
      const queryResult = await CommonService.query(
        COUNT_ENTRANCES_WITH_QUALITY_BY_MASSIF,
        [massifId]
      );
      return parseInt(queryResult.rows[0].count, 10);
    } catch (e) {
      sails.log.error(e);
      return 0;
    }
  },

  /**
   *
   * @param {string} countryId alpha-2 code
   * @param {int} limit
   * @param {int} offset
   * @returns {Object} the date of the latest update and the number of contributions on all entrances in a country
   *          or null if no result or something went wrong
   */
  getEntrancesWithQualityByCountry: async (
    countryId,
    limit = null,
    offset = null
  ) => {
    try {
      const params =
        limit !== null && offset !== null
          ? [countryId, limit, offset]
          : [countryId];
      const query =
        limit !== null && offset !== null
          ? GET_ENTRANCES_WITH_QUALITY_BY_COUNTRY
          : GET_ENTRANCES_WITH_QUALITY_BY_COUNTRY.replace(
              'LIMIT $2 OFFSET $3',
              ''
            );
      const queryResult = await CommonService.query(query, params);
      return queryResult.rows;
    } catch (e) {
      sails.log.error(e);
      return null;
    }
  },

  /**
   *
   * @param {string} countryId alpha-2 code
   * @returns {int} count of entrances in country
   */
  getEntrancesWithQualityByCountryCount: async (countryId) => {
    try {
      const queryResult = await CommonService.query(
        COUNT_ENTRANCES_WITH_QUALITY_BY_COUNTRY,
        [countryId]
      );
      return parseInt(queryResult.rows[0].count, 10);
    } catch (e) {
      sails.log.error(e);
      return 0;
    }
  },

  /**
   *
   * @param {string} regionId ISO 3166-2 code (e.g., 'US-TN')
   * @param {int} limit
   * @param {int} offset
   * @returns {Object} the date of the latest update and the number of contributions on all entrances in a region
   *          or null if no result or something went wrong
   */
  getEntrancesWithQualityByRegion: async (
    regionId,
    limit = null,
    offset = null
  ) => {
    try {
      const params =
        limit !== null && offset !== null
          ? [regionId, limit, offset]
          : [regionId];
      const query =
        limit !== null && offset !== null
          ? GET_ENTRANCES_WITH_QUALITY_BY_REGION
          : GET_ENTRANCES_WITH_QUALITY_BY_REGION.replace(
              'LIMIT $2 OFFSET $3',
              ''
            );
      const queryResult = await CommonService.query(query, params);
      return queryResult.rows;
    } catch (e) {
      sails.log.error(e);
      return null;
    }
  },

  /**
   *
   * @param {string} regionId ISO 3166-2 code (e.g., 'US-TN')
   * @returns {int} count of entrances in region
   */
  getEntrancesWithQualityByRegionCount: async (regionId) => {
    try {
      const queryResult = await CommonService.query(
        COUNT_ENTRANCES_WITH_QUALITY_BY_REGION,
        [regionId]
      );
      return parseInt(queryResult.rows[0].count, 10);
    } catch (e) {
      sails.log.error(e);
      return 0;
    }
  },

  /**
   *
   * @param {number} entranceId
   * @returns {Object|null} the materialized view row, or null if not found
   */
  getEntranceQualityById: async (entranceId) => {
    try {
      const queryResult = await CommonService.query(
        'SELECT * FROM v_data_quality_compute_entrance WHERE id_entrance = $1 ORDER BY id_massif NULLS LAST LIMIT 1',
        [entranceId]
      );
      return queryResult.rows[0] || null;
    } catch (e) {
      sails.log.error(e);
      return null;
    }
  },
};
