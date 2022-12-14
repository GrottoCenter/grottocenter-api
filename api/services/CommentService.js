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

function average(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

module.exports = {
  /**
   * @param {integer} entranceId - id of the entrance for which stats are needed
   *
   * @returns {Promise} which resolves to the succesfully getStats
   */
  getStatsFromComments: (comments) => {
    const filterFn = (e) => e && e > 0;
    return {
      aestheticism: average(
        comments.map((c) => c.aestheticism).filter(filterFn)
      ),
      caving: average(comments.map((c) => c.caving).filter(filterFn)),
      approach: average(comments.map((c) => c.approach).filter(filterFn)),
    };
  },
  getStatsFromId: async (entranceId) => {
    const [aestheticism, caving, approach] = await Promise.all([
      TComment.avg('aestheticism').where({
        entrance: entranceId,
        aestheticism: { '>': 0 },
      }),
      TComment.avg('caving').where({
        entrance: entranceId,
        caving: { '>': 0 },
      }),
      TComment.avg('approach').where({
        entrance: entranceId,
        approach: { '>': 0 },
      }),
    ]);

    return { aestheticism, caving, approach };
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
  getEntranceComments: async (entranceId, { includeDeleted = false } = {}) => {
    let comments = [];
    if (entranceId) {
      comments = await TComment.find()
        .where({ entrance: entranceId, isDeleted: includeDeleted })
        .populate('author')
        .populate('reviewer');
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

  getComment: async (commentId, { includeDeleted = false } = {}) =>
    TComment.findOne({ id: commentId, isDeleted: includeDeleted })
      .populate('author')
      .populate('reviewer'),
};
