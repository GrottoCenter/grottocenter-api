const dayjs = require('../utils/dayjs');

const CommonService = require('./CommonService');

module.exports = {
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
    // query to get time infos average
    const TIME_INFO_QUERY = `
    SELECT avg(e_t_trail) AS avg_t_trail, avg(e_t_underground) AS avg_t_underground
    FROM t_comment WHERE id_entrance=$1`;

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

  /**
   *
   * @param pgInterval PostgresInterval Object {hours: ${number}, minutes: ${number}, seconds: ${number}}
   * @returns string with format HH:mm:ss
   */
  postgreIntervalObjectToDbString: (pgInterval) => {
    if (!pgInterval) return null;
    // PG interval for trip durations never includes months/years — only
    // days, hours, minutes, seconds are expected from the AVG query.
    const merged = { days: 0, hours: 0, minutes: 0, seconds: 0, ...pgInterval };
    // Accumulate days into hours so formatting doesn't wrap at 24h
    merged.hours += merged.days * 24;
    // dayjs.duration().format() outputs "undefined" for missing fields,
    // so all three components must be explicitly present in the object.
    return dayjs
      .duration({
        hours: merged.hours,
        minutes: merged.minutes,
        seconds: merged.seconds,
      })
      .format('HH:mm:ss');
  },

  getEntranceComments: async (entranceId, where = {}) => {
    if (!entranceId) return [];
    return TComment.find({ ...where, entrance: entranceId })
      .populate('author')
      .populate('reviewer');
  },

  getEntranceHComments: async (entranceId, where = {}) => {
    if (!entranceId) return [];
    const commentIds = await TComment.find({
      where: { ...where, entrance: entranceId },
      select: ['id'],
    });
    return module.exports.getHComments(commentIds.map((e) => e.id));
  },

  getComment: async (commentId) =>
    TComment.findOne({ id: commentId }).populate('author').populate('reviewer'),

  getHComments: async (commentId) =>
    HComment.find({ t_id: commentId }).populate('reviewer').populate('author'),
};
