'use strict';
module.exports = {
  /**
   * @param {integer} entryId - id of the entry for which stat is needed
   * @param {function} next - callback
   *
   * @returns {Promise} which resolves to the succesfully getStats
   */
  getStats: function(entryId) {
    return new Promise((resolve) => {
      // relevance
      TComment.find({
        entry: entryId
      }).average('relevance').exec(function(err, results) {
        let statistics = new Object();
        if (err) {
          sails.log.error(err);
        } else {
          statistics.relevance = results[0].relevance;
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
    return new Promise((resolve) => {
      // eTTrail
      TComment.find({
        entry: entryId,
        eTTrail: {'!': null}
      }).limit(1).exec(function(err, results) {
        let timeInfos = new Object();
        if (err) {
          sails.log.error(err);
        } else {
            if (results[0] !== undefined) {
              timeInfos.eTTrail = results[0].eTTrail;
            }
        }
        // eTUnderground
        TComment.find({
          entry: entryId,
          eTUnderground: {'!': null}
        }).limit(1).exec(function(err, results) {
          if (err) {
            sails.log.error(err);
          } else {
            if (results[0] !== undefined) {
              timeInfos.eTUnderground = results[0].eTUnderground;
            }
          }
          // resolve timeInfos at last
          resolve(timeInfos);
        });
      });
    });
  }
};
