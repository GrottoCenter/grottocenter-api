// query to get all entrances of interest
const MAIN_LANGUAGE_QUERY = `
    SELECT l.* FROM t_language AS l
    LEFT JOIN j_document_language jdl ON jdl.id_language = l.id
    LEFT JOIN t_document d ON d.id = jdl.id_document
    WHERE d.id = $1
    AND jdl.is_main = true
`;

module.exports = {
  /**
   * @returns {Promise} which resolves to the succesfully findRandom
   */
  getMainLanguage: async (id) => {
    const result = await CommonService.query(MAIN_LANGUAGE_QUERY, [id]);
    const language = result.rows[0];
    return language;
  },
};
