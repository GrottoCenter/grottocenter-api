// query to get all entrances of interest
const MAIN_LANGUAGE_QUERY = `
    SELECT l.* FROM t_language AS l
    LEFT JOIN j_document_language jdl ON jdl.id_language = l.id
    LEFT JOIN t_document d ON d.id = jdl.id_document
    WHERE d.id = $1
    AND jdl.is_main = true
`;

const oldTopoFilesUrl = 'https://www.grottocenter.org/upload/topos/';

const ramda = require('ramda');

module.exports = {
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

  createDocument: async (dataDocument, dataLangDesc, errorHandler) => {
    return await sails
      .getDatastore()
      .transaction(async (db) => {
        const documentCreated = await TDocument.create(dataDocument)
          .fetch()
          .usingConnection(db);

        // Create associated data not handled by TDocument manually
        if (ramda.pathOr(null, ['documentMainLanguage', 'id'], dataLangDesc)) {
          await JDocumentLanguage.create({
            document: documentCreated.id,
            language: dataLangDesc.documentMainLanguage.id,
            isMain: true,
          }).usingConnection(db);
        }

        await TDescription.create({
          author: dataLangDesc.author,
          body: dataLangDesc.description,
          dateInscription: ramda.propOr(
            new Date(),
            'dateInscription',
            dataLangDesc,
          ),
          dateReviewed: ramda.propOr(undefined, 'dateReviewed', dataLangDesc),
          document: documentCreated.id,
          language: dataLangDesc.titleAndDescriptionLanguage.id,
          title: dataLangDesc.title,
        }).usingConnection(db);

        return documentCreated;
      })
      .intercept(errorHandler);
  },
};
