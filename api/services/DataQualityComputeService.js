const CommonService = require('./CommonService');

/**
 * this service is used to retrieves the elements included
 * in the computation of the quality of the data of an entrance.
 */
const GET_ENTRANCES_WITH_QUALITY_BY_MASSIF = `
  SELECT *
  FROM v_data_quality_compute_entrance
  WHERE id_massif = $1
`;

const GET_ENTRANCES_WITH_QUALITY_BY_COUNTRY = `
  SELECT DISTINCT id_entrance, general_latest_date_of_update, general_nb_contributions, location_latest_date_of_update, location_nb_contributions, description_latest_date_of_update, description_nb_contributions, document_latest_date_of_update, document_nb_contributions, rigging_latest_date_of_update, rigging_nb_contributions, history_latest_date_of_update, history_nb_contributions, comment_latest_date_of_update, comment_nb_contributions, entrance_name, id_country, country_name, date_of_update
  FROM v_data_quality_compute_entrance
  WHERE id_country = $1
`;

const GET_ENTRANCES_WITH_QUALITY_BY_REGION = `
  SELECT DISTINCT v.id_entrance, v.general_latest_date_of_update, v.general_nb_contributions, v.location_latest_date_of_update, v.location_nb_contributions, v.description_latest_date_of_update, v.description_nb_contributions, v.document_latest_date_of_update, v.document_nb_contributions, v.rigging_latest_date_of_update, v.rigging_nb_contributions, v.history_latest_date_of_update, v.history_nb_contributions, v.comment_latest_date_of_update, v.comment_nb_contributions, v.entrance_name, v.id_country, v.country_name, v.date_of_update
  FROM v_data_quality_compute_entrance v
  JOIN t_entrance e ON v.id_entrance = e.id
  WHERE e.iso_3166_2 = $1
`;

module.exports = {
  /**
   *
   * @param {int} massifId
   * @returns {Object} the date of the latest update and the number of contributions on all entrances in a massif
   *          or null if no result or something went wrong
   */
  getEntrancesWithQualityByMassif: async (massifId) => {
    try {
      const queryResult = await CommonService.query(
        GET_ENTRANCES_WITH_QUALITY_BY_MASSIF,
        [massifId]
      );
      return queryResult.rows;
    } catch (e) {
      return null;
    }
  },

  /**
   *
   * @param {string} countryId alpha-2 code
   * @returns {Object} the date of the latest update and the number of contributions on all entrances in a country
   *          or null if no result or something went wrong
   */
  getEntrancesWithQualityByCountry: async (countryId) => {
    try {
      const queryResult = await CommonService.query(
        GET_ENTRANCES_WITH_QUALITY_BY_COUNTRY,
        [countryId]
      );
      return queryResult.rows;
    } catch (e) {
      return null;
    }
  },

  /**
   *
   * @param {string} regionId ISO 3166-2 code (e.g., 'US-TN')
   * @returns {Object} the date of the latest update and the number of contributions on all entrances in a region
   *          or null if no result or something went wrong
   */
  getEntrancesWithQualityByRegion: async (regionId) => {
    try {
      const queryResult = await CommonService.query(
        GET_ENTRANCES_WITH_QUALITY_BY_REGION,
        [regionId]
      );
      return queryResult.rows;
    } catch (e) {
      return null;
    }
  },
};
