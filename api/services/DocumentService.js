const DescriptionService = require('./DescriptionService');
const SearchService = require('./SearchService');
const FileService = require('./FileService');
const NameService = require('./NameService');
const NotificationService = require('./NotificationService');
const RecentChangeService = require('./RecentChangeService');
const {
  valIfTruthyOrNull,
  distantFileDownload,
} = require('../utils/csvHelper');
const {
  DOCUMENT_M2M_COLLECTIONS,
  TYPES_ALLOWING_PARENT,
  TYPES_REQUIRING_PARENT,
} = require('../../config/constants/document');
const {
  computeDocumentAuthorsSort,
} = require('../utils/computeDocumentAuthorsSort');

// Normalize a collection value to a plain ID (handles both raw IDs and objects).
const normalizeToId = (item) =>
  item != null && typeof item === 'object' ? (item.id ?? item) : item;

// Maps a populated authorsOrganization array to the Typesense-ready shape.
// Exported so property tests can exercise the actual function rather than a copy.
const mapAuthorsOrganizationForSearch = (orgs) =>
  orgs?.map((e) => ({ name: e.names?.[0]?.name })) ?? [];

// Extract the document's main language from the request body.
// Prefers `documentMainLanguage.id` (current front-end field) with
// fallback to `mainLanguage` (legacy/backward-compat).
//
// Returns:
//   undefined  — neither field present; caller should leave existing associations untouched
//   []         — field present but empty; caller should clear the collection
//   [lang]     — field present with a value; caller should replace the collection
const getDocumentLanguages = (body) => {
  const lang = body.documentMainLanguage?.id ?? body.mainLanguage;
  if (lang === undefined) return undefined;
  return lang ? [lang] : [];
};

module.exports = {
  async deleteInSearch(documentId) {
    await SearchService.deleteDocument('documents', documentId);
  },

  async updateInSearch(populatedDocument) {
    // Warning: All linked entities may contain sensitive information (same as in entrance).
    // For example, the complete caver object for the 'author' and 'reviewer' fields.
    // Although we could leave them intact, since search results also pass through the converter,
    // We prefer to clean them to ensure only clean data remains in the search database.
    const {
      authors,
      authorsOrganization,
      descriptions,
      subjects,
      countries,
      isoRegions,
      editor,
      library,
      massifs,
      entrance,
      cave,
      parent,
      ...d
    } = populatedDocument;
    const document = {
      id: d.id,
      importId: d.idDbImport,
      identifier: d.identifier,
      identifierType: d.identifierType?.id?.trim(),
      importSource: d.nameDbImport,
      dateInscription: d.dateInscription,
      dateReviewed: d.dateReviewed,
      dateValidation: d.dateValidation,
      creatorId: d.author.id,
      creator: d.author.nickname,
      creatorComment: d.creatorComment,
      reviewerId: d.reviewer?.id,
      reviewer: d.reviewer?.nickname,
      validatorId: d.validator?.id,
      validator: d.validator?.nickname,
      type: d.type?.name,
      title: descriptions?.[0]?.title,
      description: descriptions?.[0]?.body,
      issue: d.issue,
      pages: d.pages,
      license: d.license?.name,
      parent: parent && {
        type: parent.type?.name,
        title: parent.descriptions?.[0]?.title,
        description: parent.descriptions?.[0]?.body,
      },
      editor: editor && { name: editor.names?.[0]?.name },
      library: library && { name: library.names?.[0]?.name },
      authors: authors?.map((e) => ({ nickname: e.nickname })),
      authorsOrganization: mapAuthorsOrganizationForSearch(authorsOrganization),
      // Keep the denormalized author sort key in sync on single-doc upserts so
      // edits match the full-reindex baseline (see computeDocumentAuthorsSort).
      // Uses `e.name` — the main name NameService.setNames() resolves from the
      // `isMain` row — because the full reindex selects `n.is_main = true`.
      // `e.names[0]` carries no ordering guarantee and would drift from the
      // reindexed key as soon as an organization's main name changes.
      authorsSort: computeDocumentAuthorsSort(
        authors?.map((e) => e.nickname),
        authorsOrganization?.map((e) => e.name)
      ),
      subjects: subjects?.map((e) => ({ code: e.id })),
      iso3166: [
        ...(countries?.map((e) => ({ iso: e.id, name: e.nativeName })) ?? []),
        ...(isoRegions?.map((e) => ({ iso: e.id, name: e.name })) ?? []),
      ],
      cave: cave && { name: cave.names?.[0]?.name },
      entrance: entrance && { name: entrance.names?.[0]?.name },
      massifs: massifs?.map((e) => ({ name: e.names?.[0]?.name })),
    };
    await SearchService.updateDocument('documents', document);
  },

  getDescriptionDataFromClient: (body, authorId) => ({
    author: authorId,
    body: body.description,
    title: body.title,
    language: body.titleAndDescriptionLanguage?.id ?? body.mainLanguage,
  }),

  getChangedFileFromClient: (fileObjectArray) =>
    fileObjectArray.map((e) => ({
      id: e.id,
      fileName: e.fileName,
    })),

  // Extract everything from the request body except id and dateInscription
  // Used when creating or editing an existing document
  getConvertedDataFromClient: async (body) => {
    // Massif will be deleted in the future (a document can be about many massifs and a massif can be the subject of many documents): use massifs
    const massif = body.massif?.id;

    // Interprets a m2m collection field coming from a multipart/form-data body.
    // FormData cannot express an empty array, so the front-end sends the literal
    // string '[]' to signal an intentional "clear all" operation.
    //   undefined  → not sent by the client; keep existing associations untouched
    //   '[]'       → explicitly cleared; replace with an empty array
    //   array      → replace with the mapped ids
    const parseIdList = (v, mapper) => {
      if (v === undefined) return undefined;
      if (v === '[]') return [];
      return v.map(mapper);
    };

    // For massifs we merge the legacy scalar `massif` field with the array.
    // An explicit '[]' on `massifs` with no legacy massif means "clear all".
    let massifs;
    if (body.massifs === undefined && massif === undefined) {
      massifs = undefined;
    } else {
      massifs = [
        ...(body.massifs === '[]'
          ? []
          : (body.massifs ?? []).map((m) => m.id ?? m)),
        ...(massif ? [massif] : []),
      ];
    }

    // iso3166 carries both isoRegions (length > 2) and countries (length <= 2).
    // An explicit '[]' means "clear both collections".
    // Parse once, then split by ISO code length to avoid iterating the same
    // array twice (and to make the undefined/'[]'/array distinction explicit).
    const isoList = parseIdList(body.iso3166, (s) => s.iso);
    const isoRegions = isoList?.filter((e) => e.length > 2);
    const countries = isoList?.filter((e) => e.length <= 2);

    let optionFound;
    // eslint-disable-next-line no-param-reassign
    if (body.option) optionFound = await TOption.findOne({ name: body.option });
    let typeFound;
    if (body.type) typeFound = await TType.findOne({ name: body.type });

    return {
      identifier: body.identifier,
      identifierType: body.identifierType?.id,

      // dateInscription is added only at document creation
      // dateReviewed will be updated automaticly by the SQL historisation trigger
      datePublication: valIfTruthyOrNull(body.datePublication),
      // author are added only at document creation (done after if needed)
      authors: parseIdList(body.authors, (a) => a.id),
      authorsOrganization: parseIdList(body.authorsOrganization, (a) => a.id),
      editor: body.editor?.id,
      library: body.library?.id,
      authorComment: body.creatorComment,

      type: typeFound?.id,
      // descriptions is changed independently
      subjects: parseIdList(body.subjects, (s) => s.id ?? s.code),
      issue: valIfTruthyOrNull(body.issue),
      pages: valIfTruthyOrNull(body.pages),
      license: body.license?.id ?? 1,
      option: optionFound?.id,
      languages: getDocumentLanguages(body),
      // massif, // Deprecated, use massifs instead
      massifs,
      // cave is linked with the cave/add-document controller
      // entrance is linked with the entrance/add-document controller
      // files changes are handled independently
      // regions: body.regions?.map((r) => r.id), // Deprecated
      isoRegions,
      countries,
      // When a type is provided and it doesn't allow a parent, explicitly clear
      // the parent field regardless of whether the client sent it. This prevents
      // a stale id_parent from surviving a type change (e.g. Issue → Collection)
      // when the front-end omits the parent field instead of sending null.
      parent:
        typeFound && !TYPES_ALLOWING_PARENT.includes(typeFound.id)
          ? null
          : body.parent?.id,
      // children cannot be set. The parent child relation can only be changed in one direction
      authorizationDocument: body.authorizationDocument?.id,
    };
  },

  appendPopulateForSimpleDocument: (docQuery) => {
    docQuery
      .populate('identifierType')
      .populate('author')
      .populate('authors')
      .populate('authorsOrganization')
      .populate('reviewer')
      .populate('validator')
      .populate('editor')
      .populate('library')
      .populate('type')
      .populate('descriptions')
      .populate('subjects')
      .populate('license')
      .populate('languages')
      .populate('option')
      // .populate('massif') // deprecated, replaced by countries and isoRegions
      .populate('countries')
      .populate('isoRegions')
      // .populate('massif') // deprecated, replaced by massifs
      .populate('massifs')
      .populate('files', { where: { isValidated: true } });
    return docQuery;
  },

  appendPopulateForFullDocument: (docQuery) => {
    module.exports
      .appendPopulateForSimpleDocument(docQuery)
      .populate('cave')
      .populate('entrances');
    // .populate('parent') // resolved in populateFullDocumentSubEntities()
    // .populate('children') // resolved in populateFullDocumentSubEntities()
    // .populate('authorizationDocument'); // resolved in populateFullDocumentSubEntities()

    return docQuery;
  },

  // Set name of cave, entrance, massif, editor and library if present
  populateFullDocumentSubEntities: async (document) => {
    const asyncQueue = [];

    // eslint-disable-next-line no-param-reassign
    document.mainLanguage = module.exports.getMainLanguage(document.languages);

    if (document.entrances && document.entrances.length > 0) {
      asyncQueue.push(NameService.setNames(document.entrances, 'entrance'));
    }
    if (document.cave) {
      asyncQueue.push(NameService.setNames([document.cave], 'cave'));
    }
    const allMassifs = document.massifs;
    if (allMassifs.length > 0) {
      asyncQueue.push(NameService.setNames(allMassifs, 'massif'));
    }
    const allGrottos = [];
    if (document.library) allGrottos.push(document.library);
    if (document.editor) allGrottos.push(document.editor);
    if (document.authorsOrganization)
      allGrottos.push(...document.authorsOrganization);
    if (allGrottos.length > 0) {
      asyncQueue.push(NameService.setNames(allGrottos, 'grotto'));
    }

    async function resolveDocument(doc, key) {
      // eslint-disable-next-line no-param-reassign
      doc[key] = (await module.exports.getDocuments([doc[key]]))[0];
    }

    if (document.parent) asyncQueue.push(resolveDocument(document, 'parent'));
    if (document.authorizationDocument)
      asyncQueue.push(resolveDocument(document, 'authorizationDocument'));

    await Promise.all(asyncQueue);

    return document;
  },

  async getPopulatedDocument(documentId) {
    const doc = await module.exports.appendPopulateForFullDocument(
      TDocument.findOne(documentId)
    );
    if (!doc) return null;
    await module.exports.populateFullDocumentSubEntities(doc);
    return doc;
  },

  /**
   * Depending on the number of languages, return the document main language.
   * @param {TLanguage[]} languages
   * @returns main language of the document
   */
  getMainLanguage: (languages) => {
    if (!languages) return undefined;
    if (languages.length === 0) return undefined;
    if (languages.length === 1) return languages[0];
    return languages.filter((l) => l.isMain);
  },

  async updateDocument({
    documentId,
    reviewerId,
    documentData,
    descriptionData,
    newFiles,
    modifiedFiles,
    deletedFiles,
  } = {}) {
    return TDocument.updateOne(documentId).set({
      dateReviewed: new Date(), // Avoid an uniqueness error
      isValidated: false,
      dateValidation: null,
      modifiedDocJson: {
        reviewerId,
        documentData,
        descriptionData,
        newFiles,
        modifiedFiles,
        deletedFiles,
      },
    });
  },

  createDocument: async (
    req,
    documentData,
    descriptionData,
    shouldDownloadDistantFile = false
  ) => {
    const document = await sails.getDatastore().transaction(async (db) => {
      // Perform some checks
      const docType =
        documentData.type && (await TType.findOne(documentData.type));
      if (docType) {
        // Parent doc is mandatory for articles and issues
        if (
          TYPES_REQUIRING_PARENT.includes(docType.id) &&
          !documentData.parent
        ) {
          throw Error(
            `Your document being an ${docType.name.toLowerCase()}, you must provide a document parent.`
          );
        }
      }

      const createdDocument = await TDocument.create(documentData)
        .fetch()
        .usingConnection(db);

      await TDescription.create({
        dateInscription: descriptionData.dateInscription ?? new Date(),
        dateReviewed: descriptionData?.dateReviewed,
        author: descriptionData.author,
        title: descriptionData.title,
        body: descriptionData.body,
        document: createdDocument.id,
        language: descriptionData.language,
      }).usingConnection(db);

      return createdDocument;
    });

    await RecentChangeService.setNameCreate(
      'document',
      document.id,
      req.token.id,
      descriptionData.title
    );

    const populatedDocuments = await module.exports.getDocuments([document.id]);
    const populatedDocument = populatedDocuments[0];

    const documentType = populatedDocument?.identifierType?.id?.trim() ?? '';
    if (documentType === 'url' && shouldDownloadDistantFile) {
      const url = populatedDocument.identifier;
      sails.log.info(`Downloading ${url}...`);
      const acceptedFileFormats = await TFileFormat.find();
      const allowedExtentions = acceptedFileFormats.map((f) =>
        f.extension.trim()
      );

      const file = await distantFileDownload({
        url,
        allowedExtentions,
      }).catch((err) => {
        sails.log.error(`Failed to download ${url}: ${err}`);
      });

      if (file) {
        await FileService.document.create(file, document.id);
      }
    }

    await NotificationService.notifySubscribers(
      populatedDocument,
      req.token.id,
      NotificationService.NOTIFICATION_TYPES.CREATE,
      NotificationService.NOTIFICATION_ENTITIES.DOCUMENT
    );

    return populatedDocument;
  },

  /**
   * Populate document-like object for a csv duplicate import or a modified document
   * Mainly used for json column that cannot be populated using waterline query language.
   * @param {*} documentData format from getConvertedDataFromClient()
   * @returns populated document
   */
  populateJSON: async (documentId, documentData) => {
    const {
      identifierType,
      author,
      authors,
      authorsOrganization,
      reviewer,
      editor,
      library,
      type,
      subjects,
      license,
      option,
      languages,
      countries,
      isoRegions,
      cave,
      entrances,
      massifs,
      parent,
      authorizationDocument,
      ...otherSimpleData
    } = documentData;

    // Normalize collections and join the tables
    const toIds = (arr) => arr.map(normalizeToId);

    // Join the tables
    const doc = { ...otherSimpleData, id: documentId };
    doc.identifierType = identifierType
      ? await TIdentifierType.findOne(identifierType)
      : null;
    doc.author = author ? await TCaver.findOne(author) : null;
    doc.authors = authors ? await TCaver.find({ id: toIds(authors) }) : [];
    doc.authorsOrganization = authorsOrganization
      ? await TGrotto.find({ id: toIds(authorsOrganization) })
      : [];
    doc.reviewer = reviewer ? await TCaver.findOne(reviewer) : null;
    doc.editor = editor ? await TGrotto.findOne(editor) : null;
    doc.library = library ? await TGrotto.findOne(library) : null;

    doc.type = type ? await TType.findOne(type) : null;
    // descriptions is a special case
    doc.subjects = subjects ? await TSubject.find({ id: toIds(subjects) }) : [];
    doc.license = license ? await TLicense.findOne(license) : null;
    doc.option = option ? await TOption.findOne(option) : null;
    doc.languages = languages
      ? await TLanguage.find({ id: toIds(languages) })
      : [];

    // TODO files ?
    doc.countries = countries
      ? await TCountry.find({ id: toIds(countries) })
      : [];
    doc.isoRegions = isoRegions
      ? await TISO31662.find({ id: toIds(isoRegions) })
      : [];
    doc.cave = cave ? await TCave.findOne(cave) : null;
    doc.entrances = entrances
      ? await TEntrance.find({ id: toIds(entrances) })
      : [];
    doc.massifs = massifs ? await TMassif.find({ id: toIds(massifs) }) : [];
    doc.parent = parent
      ? (await module.exports.getDocuments([parent]))[0]
      : null;
    doc.authorizationDocument = authorizationDocument
      ? await TDocument.findOne(authorizationDocument)
      : null;
    return doc;
  },

  /**
   * Get basic informations for a list of document ids
   * The result is intended to be passed to the toSimpleDocument converter
   * @param {Array} documentIds
   * @returns
   */
  getDocuments: async (documentIds) => {
    if (documentIds.length === 0) return [];
    return TDocument.find({ id: documentIds })
      .populate('descriptions')
      .populate('type')
      .populate('files', { where: { isValidated: true } });
  },

  /**
   * Same as getDocuments(), plus everything needed to build a bibliographic
   * citation (authors, publisher, journal, identifier...).
   * The result is intended to be passed to the toCitationDocument converter.
   * Kept apart from getDocuments() so that the callers only needing a title
   * and a type don't pay for the extra joins.
   * @param {Array} documentIds
   * @returns
   */
  getDocumentsForCitation: async (documentIds) => {
    if (documentIds.length === 0) return [];
    const documents = await TDocument.find({ id: documentIds })
      .populate('descriptions')
      .populate('type')
      .populate('files', { where: { isValidated: true } })
      .populate('identifierType')
      .populate('authors')
      .populate('authorsGrotto')
      .populate('editor')
      .populate('library');

    const grottos = documents.flatMap((d) =>
      [d.editor, d.library, ...(d.authorsGrotto ?? [])].filter((g) => g)
    );
    // A document title lives in its descriptions, which cannot be populated
    // through the parent association: resolve the parents with a second query.
    const parentIds = [
      ...new Set(documents.map((d) => d.parent).filter((id) => id)),
    ];

    const [parents] = await Promise.all([
      parentIds.length > 0
        ? TDocument.find({ id: parentIds }).populate('descriptions')
        : [],
      grottos.length > 0 ? NameService.setNames(grottos, 'grotto') : null,
    ]);

    const parentById = new Map(parents.map((p) => [p.id, p]));
    for (const document of documents) {
      document.parent = parentById.get(document.parent) ?? null;
    }

    return documents;
  },

  getDocumentChildren: async (documentId) =>
    TDocument.find({ parent: documentId })
      .populate('descriptions')
      .populate('type'),

  getHDocumentById: async (documentId) =>
    HDocument.find({ t_id: documentId })
      .populate('author')
      .populate('reviewer')
      .populate('massif')
      .populate('cave')
      .populate('editor')
      .populate('identifierType')
      .populate('library')
      .populate('license')
      .populate('type'),

  populateHDocumentsWithDescription: async (documentId, hDocuments) => {
    const descriptions =
      await DescriptionService.getHDescriptionsOfDocument(documentId);
    hDocuments.forEach((document) => {
      if (Object.keys(descriptions).length > 0) {
        // eslint-disable-next-line no-param-reassign
        document.description = descriptions[0];
        descriptions.forEach((desc) => {
          if (
            // Return true if the description should be associate to this document according to her dateReviewed
            DescriptionService.compareDescriptionDate(
              // Id represents here the dateReviewed like in the H models
              new Date(document.id),
              new Date(desc.id),
              new Date(document.description.id)
            )
          ) {
            // eslint-disable-next-line no-param-reassign
            document.description = desc;
          }
        });
      }
    });
    return hDocuments;
  },

  getIdDocumentByEntranceId: async (entranceId) => {
    if (!entranceId) return [];

    const entrance = await TEntrance.findOne(entranceId).populate('documents');
    if (!entrance) return [];

    return entrance.documents.map((doc) => ({ id: doc.id }));
  },

  getCollectionAncestors: async (documentIds) => {
    if (documentIds.length === 0) return [];

    // The CYCLE clause (PostgreSQL 14+) detects when a row has already appeared
    // in the recursive path and stops traversal, so cyclic data (e.g. a document
    // that is its own parent) can never produce an infinite loop.
    const query = `
      WITH RECURSIVE doc_hierarchy AS (
        SELECT id, id_parent, id_type
        FROM t_document
        WHERE id = ANY($1)

        UNION ALL

        SELECT d.id, d.id_parent, d.id_type
        FROM t_document d
        JOIN doc_hierarchy dh ON d.id = dh.id_parent
      )
      CYCLE id SET is_cycle USING path
      SELECT DISTINCT dh.id
      FROM doc_hierarchy dh
      JOIN t_type t ON dh.id_type = t.id
      WHERE t.name = 'Collection'
        AND dh.is_cycle = false
    `;

    const result = await sails.sendNativeQuery(query, [documentIds]);
    const collectionIds = result.rows.map((row) => row.id);

    return module.exports.getDocuments(collectionIds);
  },

  /**
   * Check whether setting `proposedParentId` as the parent of `documentId`
   * would create a cycle in the document hierarchy.
   *
   * Returns true when a cycle would be created (i.e. documentId already
   * appears in the ancestor chain of proposedParentId, or they are the same).
   *
   * @param {number} documentId       - the document being updated
   * @param {number} proposedParentId - the candidate new parent
   * @returns {Promise<boolean>}
   */
  checkParentCycle: async (documentId, proposedParentId) => {
    if (documentId === proposedParentId) return true;

    // Walk the ancestor chain of proposedParentId upward.  If documentId
    // appears anywhere along that chain, the assignment would create a cycle.
    const query = `
      WITH RECURSIVE ancestors AS (
        SELECT id, id_parent
        FROM t_document
        WHERE id = $1

        UNION ALL

        SELECT d.id, d.id_parent
        FROM t_document d
        JOIN ancestors a ON d.id = a.id_parent
      )
      CYCLE id SET is_cycle USING path
      SELECT 1
      FROM ancestors
      WHERE id = $2
        AND is_cycle = false
      LIMIT 1
    `;

    const result = await sails.sendNativeQuery(query, [
      proposedParentId,
      documentId,
    ]);
    return result.rows.length > 0;
  },

  /**
   * Validate that setting proposedParentId as the parent of documentId is safe:
   * both ids must be finite integers and the assignment must not create a cycle.
   *
   * Returns an error message string if the assignment is invalid, or null if it
   * is safe to proceed. Controllers call this and return res.badRequest(msg) on
   * a non-null result.
   *
   * @param {number} documentId
   * @param {number} proposedParentId
   * @returns {Promise<string|null>}
   */
  async validateParentAssignment(documentId, proposedParentId) {
    const numDocId = Number(documentId);
    const numParentId = Number(proposedParentId);
    if (!Number.isInteger(numDocId) || !Number.isInteger(numParentId)) {
      return 'Document id and parent id must be integers.';
    }
    const hasCycle = await module.exports.checkParentCycle(
      numDocId,
      numParentId
    );
    if (hasCycle) {
      return 'The proposed parent would create a cycle in the document hierarchy.';
    }
    return null;
  },

  /**
   * If the given type ID does not allow a parent, return null to explicitly
   *
   * Centralises the "type-vs-parent" policy so both update paths enforce the
   * same rule: update.js (via getConvertedDataFromClient) and
   * update-with-new-entities.js (which writes scalarData directly).
   *
   * @param {number|undefined} typeId        - resolved type id (may be undefined)
   * @param {number|null|undefined} parentId - current proposed parent value
   * @returns {number|null|undefined}
   */
  clearParentIfTypeDisallows: (typeId, parentId) => {
    if (typeId != null && !TYPES_ALLOWING_PARENT.includes(typeId)) {
      return null;
    }
    return parentId;
  },

  /**
   * Replace all m2m collections that are explicitly present in collectionData.
   * Fields set to `undefined` are left untouched (not sent by the client).
   * Fields set to an array (including `[]`) replace the current associations.
   *
   * Must be called inside an active Waterline transaction — pass `db` from the
   * surrounding `sails.getDatastore().transaction(async (db) => { ... })` call.
   *
   * @param {number} documentId
   * @param {object} collectionData  — keys are m2m field names, values are
   *                                   id arrays or undefined
   * @param {object} db              — Waterline connection from the active transaction
   */
  async replaceM2MCollections(documentId, collectionData, db) {
    const promises = DOCUMENT_M2M_COLLECTIONS.filter(
      (field) => collectionData[field] !== undefined
    ).map((field) =>
      TDocument.replaceCollection(documentId, field)
        .members(collectionData[field])
        .usingConnection(db)
    );
    await Promise.all(promises);
  },

  normalizeToId,
  mapAuthorsOrganizationForSearch,
};
