const DescriptionService = require('./DescriptionService');
const ElasticsearchService = require('./ElasticsearchService');
const FileService = require('./FileService');
const NameService = require('./NameService');
const NotificationService = require('./NotificationService');
const RecentChangeService = require('./RecentChangeService');
const {
  valIfTruthyOrNull,
  distantFileDownload,
} = require('../utils/csvHelper');

const getAdditionalESIndexFromDocumentType = (document) => {
  if (document.type === 'Issue') {
    return 'document-issues';
  }
  if (document.type === 'Collection') {
    return 'document-collections';
  }
  return '';
};

// Used to create or update a document in elasticsearch
// Should match the the same format than the logstash document sql query
const getElasticsearchBody = (doc) => ({
  id: doc.id,
  identifier: doc.identifier ?? null,
  id_identifier_type: doc.identifierType?.id ?? null,
  deleted: doc.isDeleted,
  id_db_import: doc.idDbImport ?? null,
  name_db_import: doc.nameDbImport ?? null,
  date_publication: doc.datePublication ?? null,
  'contributor id': doc.author.id,
  'contributor nickname': doc.author.nickname,
  subjects: doc.subjects?.map((e) => e.id)?.join(', ') ?? null,
  authors: doc.authors?.map((a) => a.nickname).join(', ') ?? null,
  'type id': doc.type?.id,
  'type name': doc.type?.name,
  title: doc.descriptions?.[0].title,
  description: doc.descriptions?.[0].body,
  issue: doc.issue ?? null,
  countries: doc?.countries?.map((e) => e.id)?.join(', ') ?? [],
  iso_regions: doc?.isoRegions?.map((e) => e.id)?.join(', ') ?? [],
  'editor id': doc.editor?.id ?? null,
  'editor name': doc.editor?.name ?? null,
  'library id': doc.library?.id ?? null,
  'library name': doc.library?.name ?? null,
});

module.exports = {
  updateESDocument: async (document) => {
    // TODO: proper update
    await module.exports.deleteESDocument(document);
    await module.exports.createESDocument(document);
  },

  deleteESDocument: async (document) => {
    await ElasticsearchService.deleteResource('documents', document.id);
    const additionalIndex = getAdditionalESIndexFromDocumentType(document);

    // Delete in document-collections-index or document-issues-index
    if (additionalIndex !== '') {
      await ElasticsearchService.deleteResource(additionalIndex, document.id);
    }
  },

  /**
   * Based on the logstash.conf file.
   * The document must be fully populated and with all its names set
   *    (@see DocumentService.populateFullDocumentSubEntities).
   */
  createESDocument: async (document) => {
    const esBody = getElasticsearchBody(document);
    await ElasticsearchService.create('documents', document.id, {
      ...esBody,
      tags: ['document'],
    });
    // Create in document-collections-index or document-issues-index
    const additionalIndex = getAdditionalESIndexFromDocumentType(document);

    if (additionalIndex !== '') {
      await ElasticsearchService.create(additionalIndex, document.id, {
        ...esBody,
        tags: [`document-${document.type.name.toLowerCase()}`],
      });
    }
  },

  getDescriptionDataFromClient: (body, authorId) => ({
    author: authorId,
    body: body.description,
    title: body.title,
    language: body.mainLanguage,
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
    const massifs = [...(body.massifs ?? []), ...(massif ? [massif] : [])];

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
      authors: body.authors?.map((a) => a.id),
      authorsGrotto: body.authorsGrotto?.map((a) => a.id),
      editor: body.editor?.id,
      library: body.library?.id,
      authorComment: body.creatorComment,

      type: typeFound?.id,
      // descriptions is changed independently
      subjects: body.subjects?.map((s) => s.id ?? s.code),
      issue: valIfTruthyOrNull(body.issue),
      pages: valIfTruthyOrNull(body.pages),
      license: body.license?.id ?? 1,
      option: optionFound?.id,
      languages: body.mainLanguage ? [body.mainLanguage] : [],
      // massif, // Deprecated, use massifs instead
      massifs,
      // cave is linked with the cave/add-document controller
      // entrance is linked with the entrance/add-document controller
      // files changes are handled independently
      // regions: body.regions?.map((r) => r.id), // Deprecated
      isoRegions: body.iso3166?.map((s) => s.iso)?.filter((e) => e.length > 2),
      countries: body.iso3166?.map((s) => s.iso)?.filter((e) => e.length <= 2),
      parent: body.parent?.id,
      // children cannot be set. The parent child relation can only be changed in one direction
      authorizationDocument: body.authorizationDocument?.id,
    };
  },

  appendPopulateForSimpleDocument: (docQuery) => {
    docQuery
      .populate('identifierType')
      .populate('author')
      .populate('authors')
      .populate('authorsGrotto')
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
      .populate('entrance');
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

    if (document.entrance) {
      asyncQueue.push(NameService.setNames([document.entrance], 'entrance'));
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
    if (document.authorsGrotto) allGrottos.push(...document.authorsGrotto);
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
    // Doc types needing a parent in order to be created
    // (ex; an issue needs a collection, an article needs an issue)
    const MANDATORY_PARENT_TYPES = ['article', 'issue'];

    const document = await sails.getDatastore().transaction(async (db) => {
      // Perform some checks
      const docType =
        documentData.type && (await TType.findOne(documentData.type));
      if (docType) {
        const docTypeName = docType.name.toLowerCase();
        // Parent doc is mandatory for articles and issues
        if (
          MANDATORY_PARENT_TYPES.includes(docTypeName) &&
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
      req,
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
      authorsGrotto,
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
      entrance,
      massifs,
      parent,
      authorizationDocument,
      ...otherSimpleData
    } = documentData;

    // Join the tables
    const doc = { ...otherSimpleData, id: documentId };
    doc.identifierType = identifierType
      ? await TIdentifierType.findOne(identifierType)
      : null;
    doc.author = author ? await TCaver.findOne(author) : null;
    doc.authors = authors ? await TCaver.find({ id: authors }) : [];
    doc.authorsGrotto = authorsGrotto
      ? await TGrotto.find({ id: authorsGrotto })
      : [];
    doc.reviewer = reviewer ? await TCaver.findOne(reviewer) : null;
    doc.editor = editor ? await TGrotto.findOne(editor) : null;
    doc.library = library ? await TGrotto.findOne(library) : null;

    doc.type = type ? await TType.findOne(type) : null;
    // descriptions is a special case
    doc.subjects = subjects ? await TSubject.find({ id: subjects }) : [];
    doc.license = license ? await TLicense.findOne(license) : null;
    doc.option = option ? await TOption.findOne(option) : null;
    doc.languages = languages ? await TLanguage.find({ id: languages }) : [];

    // TODO files ?
    doc.countries = countries ? await TCountry.find({ id: countries }) : [];
    doc.isoRegions = isoRegions ? await TISO31662.find({ id: isoRegions }) : [];
    doc.cave = cave ? await TCave.findOne(cave) : null;
    doc.entrance = entrance ? await TEntrance.findOne(entrance) : null;
    doc.massifs = massifs ? await TCountry.find({ id: massifs }) : [];
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
      .populate('entrance')
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
    let documentsId = [];
    if (entranceId) {
      documentsId = await TDocument.find({
        where: { entrance: entranceId },
        select: ['id'],
      });
    }
    return documentsId;
  },
};
