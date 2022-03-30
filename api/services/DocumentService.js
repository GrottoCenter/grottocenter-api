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
  WHERE is_validated = true
  AND is_deleted = false;
`;

// Doc types needing a parent in order to be created (ex; an issue needs a collection, an article needs an issue)
const MANDATORY_PARENT_TYPES = ['article', 'issue'];

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
    const childrenAndGrandChildren = await TDocument.find({
      id: { in: childIds },
    }).populate('descriptions');
    const children = childrenAndGrandChildren.filter(
      (c) => c.parent === doc.id,
    );
    const grandChildren = childrenAndGrandChildren.filter(
      (c) => c.parent !== doc.id,
    );

    const formattedChildren = [];
    // Format children
    for (const childDoc of children) {
      // Is a direct child ?
      if (childDoc.parent === doc.id) {
        formattedChildren.push(childDoc);
      }
    }
    // Format grand children
    for (const grandChildDoc of grandChildren) {
      const childIdx = formattedChildren.findIndex(
        (c) => c.id === grandChildDoc.parent,
      );
      if (childIdx !== -1) {
        const alreadyPickedChild = formattedChildren[childIdx];
        if (alreadyPickedChild.children) {
          alreadyPickedChild.children.push(grandChildDoc);
        } else {
          alreadyPickedChild.children = [grandChildDoc];
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
      pathOld: oldTopoFilesUrl + f.path,
    }));
  },

  createDocument: async (documentData, langDescData) => {
    const createdDocument = await sails
      .getDatastore()
      .transaction(async (db) => {
        // Perform some checks
        const docType = documentData.type && (await TType.findOne(documentData.type));
        if (docType) {
          const docTypeName = docType.name.toLowerCase();
          // Parent doc is mandatory for articles and issues
          if (
            MANDATORY_PARENT_TYPES.includes(docTypeName)
            && !documentData.parent
          ) {
            throw Error(
              `Your document being an ${
                docType.name.toLowerCase()
              }, you must provide a document parent.`,
            );
          }
        }

        const createdDocument = await TDocument.create(documentData)
          .fetch()
          .usingConnection(db);

        // Create associated data not handled by TDocument manually
        if (ramda.pathOr(null, ['documentMainLanguage', 'id'], langDescData)) {
          await JDocumentLanguage.create({
            document: createdDocument.id,
            language: langDescData.documentMainLanguage.id,
            isMain: true,
          }).usingConnection(db);
        }

        await TDescription.create({
          author: langDescData.author,
          body: langDescData.description,
          dateInscription: ramda.propOr(
            new Date(),
            'dateInscription',
            langDescData,
          ),
          dateReviewed: ramda.propOr(undefined, 'dateReviewed', langDescData),
          document: createdDocument.id,
          language: langDescData.titleAndDescriptionLanguage.id,
          title: langDescData.title,
        }).usingConnection(db);

        return createdDocument;
      });

    // Get doc with id type
    const populatedDocument = await TDocument.findOne(
      createdDocument.id,
    ).populate('identifierType');

    if (
      populatedDocument.identifier
      && ramda.pathOr('', ['identifierType', 'id'], populatedDocument).trim()
        === 'url'
    ) {
      sails.log.info(`Downloading ${populatedDocument.identifier}...`);
      const acceptedFileFormats = await TFileFormat.find();
      // Download distant file & tolerate error

      const file = await sails.helpers.distantFileDownload
        .with({
          url: populatedDocument.identifier,
          acceptedFileFormats: acceptedFileFormats.map((f) => f.extension.trim()),
          refusedFileFormats: ['html'], // don't download html page, they are not a valid file for GC
        })
        .tolerate((error) => sails.log.error(
          `Failed to download ${
            populatedDocument.identifier
          }: ${
            error.message}`,
        ));
      file ? await FileService.create(file, createdDocument.id) : '';
    }

    return populatedDocument;
  },

  /**
   * Populate any document-like object.
   * Avoid using when possible. Mainly used for json column that cannot be populated using waterline query language.
   * @param {*} document
   * @returns populated document
   */
  populateJSON: async (document) => {
    const {
      author,
      authors,
      cave,
      editor,
      entrance,
      identifierType,
      languages,
      library,
      license,
      massif,
      parent,
      regions,
      reviewer,
      subjects,
      type,
      option,
      authorizationDocument,
      ...cleanedData
    } = document;

    // Join the tables
    const doc = { ...cleanedData };
    doc.authorizationDocument = authorizationDocument
      ? await TDocument.findOne(authorizationDocument)
      : null;
    doc.cave = cave ? await TCave.findOne(cave) : null;
    doc.editor = editor ? await TGrotto.findOne(editor) : null;
    doc.entrance = entrance ? await TEntrance.findOne(entrance) : null;
    doc.identifierType = identifierType
      ? await TIdentifierType.findOne(identifierType)
      : null;
    doc.library = library ? await TGrotto.findOne(library) : null;
    doc.license = license ? await TLicense.findOne(license) : null;
    doc.massif = massif ? await TMassif.findOne(massif) : null;
    doc.option = option ? await TOption.findOne(option) : null;
    doc.parent = parent ? await TDocument.findOne(parent) : null;
    doc.reviewer = reviewer ? await TCaver.findOne(reviewer) : null;
    doc.type = type ? await TType.findOne(type) : null;

    doc.authors = authors
      ? await Promise.all(
        authors.map(async (author) => await TCaver.findOne(author)),
      )
      : [];
    doc.languages = languages
      ? await Promise.all(
        languages.map(async (lang) => await TLanguage.findOne(lang)),
      )
      : [];
    doc.regions = regions
      ? await Promise.all(
        regions.map(async (region) => await TRegion.findOne(region)),
      )
      : [];
    doc.subjects = subjects
      ? await Promise.all(
        subjects.map(async (subject) => await TSubject.findOne(subject)),
      )
      : [];
    return doc;
  },

  setDocumentType: async (document) => {
    document.type = await TType.findOne(document.type);
  },

  setDocumentLicense: async (document) => {
    document.license = await TLicense.findOne(document.license);
  },

  setDocumentFiles: async (document) => {
    document.files = await TFile.find({ document: document.id });
  },
};
