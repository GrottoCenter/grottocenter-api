'use strict';
// query to get time infos average
const TIME_INFO_QUERY = 'SELECT SEC_TO_TIME(AVG(IF(E_t_trail>0,TIME_TO_SEC(E_t_trail),null))) AS eTTrail,'
                        + ' SEC_TO_TIME(AVG(IF(E_t_underground>0,TIME_TO_SEC(E_t_underground),null))) AS eTUnderground'
                        + ' FROM t_comment WHERE Id_entry=?';
module.exports = {
  /**
   * @param {integer} entryId - id of the entry for which stat is needed
   *
   * @returns {Promise} which resolves to the succesfully getStats
   */
  getStats: function(entryId) {
    return new Promise((resolve) => {
      // aestheticism
      TComment.find({
        entry: entryId
      }).average('aestheticism').exec(function(err, results) {
        let statistics = new Object();
        if (err) {
          sails.log.error(err);
        } else {
          statistics.aestheticism = results[0].aestheticism;
        }
        // caving
        TComment.find({
          entry: entryId
        }).average('caving').exec(function(err, results) {
          if (err) {
            sails.log.error(err);
          } else {
            statistics.caving = results[0].caving;
          }
          // approach
          TComment.find({
            entry: entryId
          }).average('approach').exec(function(err, results) {
            if (err) {
              sails.log.error(err);
            } else {
              statistics.approach = results[0].approach;
            }
            // resolve statistics at last
            resolve(statistics);
          });
        });
      });
    });
  },

  /**
   * @param {integer} entryId - id of the entry for which time infos are needed
   *
   * @returns {Promise} which resolves to the succesfully getTimeInfos
   */
  getTimeInfos: function(entryId) {
    return new Promise((resolve, reject) => {
      CommonService.query(TComment, TIME_INFO_QUERY, [entryId]).then(function(results) {
        let timeInfos = new Object();
        if (results[0] !== undefined) {
          timeInfos.eTTrail = results[0].eTTrail;
          timeInfos.eTUnderground = results[0].eTUnderground;
        }
        // resolve timeInfos at last
        resolve(timeInfos);
      }, function(err) {
        // when no time info found, reject
        reject (err);
      });
    });
  }
};
