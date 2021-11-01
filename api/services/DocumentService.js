// query to get all entrances of interest
const MAIN_LANGUAGE_QUERY = `
    SELECT l.* FROM t_language AS l
    LEFT JOIN j_document_language jdl ON jdl.id_language = l.id
    LEFT JOIN t_document d ON d.id = jdl.id_document
    WHERE d.id = $1
    AND jdl.is_main = true
`;

const RECURSIVE_GET_CHILD_DOC = `
  WITH RECURSIVE recursiveChildren AS  (
    SELECT *
    FROM t_document
    WHERE id_parent = $1
  UNION ALL
      SELECT td.*
      FROM t_document td
      INNER JOIN recursiveChildren
      ON td.id_parent = recursiveChildren.id
  )
  SELECT * FROM recursiveChildren
`;

const oldTopoFilesUrl = 'https://www.grottocenter.org/upload/topos/';

const ramda = require('ramda');

module.exports = {
  /**
   * Deep populate children and sub-children only (not recursive currently)
   * @param {*} doc
   * @returns {*} the doc with its children and sub-children populated
   */
  deepPopulateChildren: async (doc) => {
    const result = await CommonService.query(RECURSIVE_GET_CHILD_DOC, [doc.id]);
    const childIds = result.rows.map((d) => d.id);

    // Populate
    const children = await TDocument.find({ id: { in: childIds } }).populate(
      'descriptions',
    );

    // Format children
    let formattedChildren = [];
    for (const childDoc of children) {
      // Is a direct child ?
      if (childDoc.parent === doc.id) {
        formattedChildren.push(childDoc);
      }
      // Is a sub-child ?
      const childIdx = formattedChildren.findIndex(
        (c) => c.id === childDoc.parent,
      );
      if (childIdx !== -1) {
        const alreadyPickedChild = formattedChildren[childIdx];
        if (alreadyPickedChild.children) {
          alreadyPickedChild.children.push(childDoc);
        } else {
          alreadyPickedChild.children = [childDoc];
        }
      }
    }
    doc.children = formattedChildren;
    return doc;
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

  createDocument: async (dataDocument, dataLangDesc) => {
    return await sails.getDatastore().transaction(async (db) => {
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
    });
  },
};
