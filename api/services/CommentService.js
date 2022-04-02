/**
 */

const moment = require('moment');
// query to get time infos average
const TIME_INFO_QUERY = `
  SELECT avg(e_t_trail) AS avg_t_trail, avg(e_t_underground) AS avg_t_underground
  FROM t_comment WHERE id_entrance=$1`;

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
      const avgTTrail = timeInfos.avg_t_trail.toISOString();
      avgTTrailFormatted = `${moment.duration(avgTTrail).hours()}:${moment
        .duration(avgTTrail)
        .minutes()}:${moment.duration(avgTTrail).seconds()}`;
    }
    if (timeInfos.avg_t_underground !== null) {
      const avgTUnderground = timeInfos.avg_t_underground.toISO();

      avgTUndergroundFormatted = `${moment
        .duration(avgTUnderground)
        .hours()}:${moment.duration(avgTUnderground).minutes()}:${moment
        .duration(avgTUnderground)
        .seconds()}`;
    }

    return {
      eTTrail: avgTTrailFormatted,
      eTUnderground: avgTUndergroundFormatted,
    };
  },
};
