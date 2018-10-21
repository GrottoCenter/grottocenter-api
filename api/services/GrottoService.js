'use strict';

// query to count official partners
const OFFICIAL_PARTNERS_COUNT_QUERY = 'SELECT COUNT(id) AS count FROM t_grotto WHERE is_official_partner=1';

module.exports = {
  /**
   * @returns {Promise} which resolves to the succesfully query of the number of official partners
   */
  getOfficialPartnersNumber: async function() {
    return await CommonService.query(OFFICIAL_PARTNERS_COUNT_QUERY, [])
      .then(function(result) {
        return result.rows[0];
      });
  }
};
