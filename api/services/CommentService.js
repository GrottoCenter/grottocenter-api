/**
 */

// query to get time infos average
const TIME_INFO_QUERY =
  'SELECT SEC_TO_TIME(AVG(IF(E_t_trail>0,TIME_TO_SEC(E_t_trail),null))) AS eTTrail,' +
  ' SEC_TO_TIME(AVG(IF(E_t_underground>0,TIME_TO_SEC(E_t_underground),null))) AS eTUnderground' +
  ' FROM t_comment WHERE Id_entry=$1';

module.exports = {
  /**
   * @param {integer} entryId - id of the entry for which stat is needed
   *
   * @returns {Promise} which resolves to the succesfully getStats
   */
  getStats: async (entryId) => {
    const aestheticism = await TComment.avg('aestheticism').where({ entry: entryId });
    const caving = await TComment.avg('caving').where({ entry: entryId });
    const approach = await TComment.avg('approach').where({ entry: entryId });

    return {
      aestheticism,
      caving,
      approach,
    };
  },

  /**
   * @param {integer} entryId - id of the entry for which time infos are needed
   *
   * @returns {Promise} which resolves to the succesfully getTimeInfos
   */
  getTimeInfos: async (entryId) => {
    const timeInfos = await CommonService.query(TIME_INFO_QUERY, [entryId]);

    return {
      eTTrail: timeInfos.rows[0].eTTrail,
      eTUnderground: timeInfos.rows[0].eTUnderground,
    };
  },
};
