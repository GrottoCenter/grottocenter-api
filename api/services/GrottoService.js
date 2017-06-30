'use strict';
// query to count official partners
const OFFICIAL_PARTNERS_COUNT_QUERY = 'SELECT COUNT(id) AS count FROM t_grotto WHERE is_official_partner=1';

module.exports = {
  /**
   * @returns {Promise} which resolves to the succesfully query of the number of official partners
   */
  getOfficialPartnersNumber: function() {
    return new Promise((resolve, reject) => {
      CommonService.query(TEntry, OFFICIAL_PARTNERS_COUNT_QUERY, []).then(function(result) {
        if (result) {
          resolve(result[0]);
        }
      }, function(err) {
        reject(err);
      });
    });
  }
};
