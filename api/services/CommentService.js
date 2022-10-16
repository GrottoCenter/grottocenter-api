/**
 */

const moment = require('moment');
const momentDurationFormatSetup = require('moment-duration-format');

momentDurationFormatSetup(moment);
// query to get time infos average
const TIME_INFO_QUERY = `
  SELECT avg(e_t_trail) AS avg_t_trail, avg(e_t_underground) AS avg_t_underground
  FROM t_comment WHERE id_entrance=$1`;

const { isNil } = require('ramda');
const CommonService = require('./CommonService');

module.exports = {
  /**
   * @param {integer} entranceId - id of the entrance for which stats are needed
   *
   * @returns {Promise} which resolves to the succesfully getStats
   */
  getStats: async (entranceId) => {
    const aestheticism = await TComment.avg('aestheticism').where({
      entrance: entranceId,
    });
    const caving = await TComment.avg('caving').where({ entrance: entranceId });
    const approach = await TComment.avg('approach').where({
      entrance: entranceId,
    });

    return {
      aestheticism,
      caving,
      approach,
    };
  },

  /**
   * @param {integer} entranceId - id of the entrance for which time infos are needed
   *
   * @returns {Promise} which resolves to the succesfully getTimeInfos
   */
  getTimeInfos: async (entranceId) => {
    const timeInfosQueryResult = await CommonService.query(TIME_INFO_QUERY, [
      entranceId,
    ]);
    const timeInfos = timeInfosQueryResult.rows[0];

    let avgTTrailFormatted = null;
    let avgTUndergroundFormatted = null;
    if (timeInfos.avg_t_trail !== null) {
      avgTTrailFormatted = module.exports.postgreIntervalObjectToDbString(
        timeInfos.avg_t_trail
      );
    }
    if (timeInfos.avg_t_underground !== null) {
      avgTUndergroundFormatted = module.exports.postgreIntervalObjectToDbString(
        timeInfos.avg_t_underground
      );
    }

    return {
      eTTrail: avgTTrailFormatted,
      eTUnderground: avgTUndergroundFormatted,
    };
  },
  getEntranceComments: async (entranceId) => {
    let comments = [];
    if (entranceId) {
      comments = await TComment.find()
        .where({
          entrance: entranceId,
        })
        .populate('author')
        .populate('reviewer')
        .populate('language');
    }
    return comments;
  },
  /**
   *
   * @param pgInterval PostgresInterval Object {hours: ${number}, minutes: ${number}, seconds: ${number}}
   * @returns string with format hh:mm:ss
   */
  postgreIntervalObjectToDbString: (pgInterval) => {
    if (isNil(pgInterval)) return null;
    const emptyDuration = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
    return moment
      .duration(Object.assign(emptyDuration, pgInterval))
      .format('hh:mm:ss', {
        trim: false,
      });
  },
};
