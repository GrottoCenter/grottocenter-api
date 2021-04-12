// query to get all entrances of interest
const MAIN_LANGUAGE_QUERY = `
    SELECT l.* FROM t_language AS l
    LEFT JOIN j_document_language jdl ON jdl.id_language = l.id
    LEFT JOIN t_document d ON d.id = jdl.id_document
    WHERE d.id = $1
    AND jdl.is_main = true
`;

const oldTopoFilesUrl = 'https://www.grottocenter.org/upload/topos/';

module.exports = {
  /**
   * @param {String} attributeName document attribute to search for
   * @param {String} attributeValue value to search for
   *
   * @returns {Boolean} true if there is a document with the attributeName equals to attributeValue in the DB, else false.
   *
   * @example checkIfExists('id', 3) will return true if there is at least one document with id 3.
   */
  checkIfExists: async (attributeName, attributeValue) => {
    const docFound = await TDocument.findOne({
      [attributeName]: attributeValue,
    });
    return docFound !== undefined;
  },

  /**
   * @returns {Promise} which resolves to the succesfully findRandom
   */
  getMainLanguage: async (id) => {
    const result = await CommonService.query(MAIN_LANGUAGE_QUERY, [id]);
    const language = result.rows[0];

    // Case conversion
    if (language) {
      const formattedLanguage = {
        ...language,
        isPrefered: language.is_prefered,
        refName: language.ref_name,
      };
      delete formattedLanguage.is_prefered;
      delete formattedLanguage.ref_name;

      return formattedLanguage;
    }
    return language;
  },

  getTopoFiles: async (docId) => {
    const files = await TFile.find({ document: docId });
    // Build path old
    return files.map((f) => ({
      ...f,
      pathOld: oldTopoFilesUrl + f.pathOld,
    }));
  },
};
