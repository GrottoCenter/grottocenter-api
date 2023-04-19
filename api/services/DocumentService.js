const RECURSIVE_GET_CHILD_DOC = `
  WITH RECURSIVE recursiveChildren AS (SELECT *
                                       FROM t_document
                                       WHERE id_parent = $1
                                       UNION ALL
                                       SELECT td.*
                                       FROM t_document td
                                              INNER JOIN recursiveChildren
                                                         ON td.id_parent = recursiveChildren.id)
  SELECT *
  FROM recursiveChildren
  WHERE is_validated = true
    AND is_deleted = false;
`;

// Doc types needing a parent in order to be created
// (ex; an issue needs a collection, an article needs an issue)
const MANDATORY_PARENT_TYPES = ['article', 'issue'];
const oldTopoFilesUrl = 'https://www.grottocenter.org/upload/topos/';
const ramda = require('ramda');
const CommonService = require('./CommonService');
const DescriptionService = require('./DescriptionService');
const ElasticsearchService = require('./ElasticsearchService');
const FileService = require('./FileService');
const NameService = require('./NameService');
const NotificationService = require('./NotificationService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('./NotificationService');

const getAdditionalESIndexFromDocumentType = (document) => {
  if (document.type.name === 'Issue') {
    return 'document-issues';
  }
  if (document.type.name === 'Collection') {
    return 'document-collections';
  }
  return '';
};

module.exports = {
  // TO DO: proper update
  updateDocumentInElasticSearchIndexes: async (document) => {
    await module.exports.deleteDocumentFromElasticsearchIndexes(document);
    await module.exports.addDocumentToElasticSearchIndexes(document);
  },

  deleteDocumentFromElasticsearchIndexes: async (document) => {
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
   *    (@see DocumentService.setNamesOfPopulatedDocument).
   */
  addDocumentToElasticSearchIndexes: async (document) => {
    const esBody = module.exports.getElasticsearchBody(document);
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

  getElasticsearchBody: (document) => {
    const { type, modifiedDocJson, ...docWithoutJsonAndType } = document;
    return {
      ...docWithoutJsonAndType,
      authors: document.authors
        ? document.authors.map((a) => a.nickname).join(', ')
        : null,
      'contributor id': document.author.id,
      'contributor nickname': document.author.nickname,
      date_part: document.datePublication
        ? new Date(document.datePublication).getFullYear()
        : null,
      description: document.descriptions[0].body,
      'editor id': ramda.pathOr(null, ['editor', 'id'], document),
      'editor name': ramda.pathOr(null, ['editor', 'name'], document),
      'library id': ramda.pathOr(null, ['library', 'id'], document),
      'library name': ramda.pathOr(null, ['library', 'name'], document),
      regions: document.regions
        ? document.regions.map((r) => r.name).join(', ')
        : null,
      subjects: document.subjects
        ? document.subjects.map((s) => s.subject).join(', ')
        : null,
      title: document.descriptions[0].title,
      'type id': ramda.propOr(null, 'id', type),
      'type name': ramda.propOr(null, 'name', type),
      deleted: document.isDeleted,
    };
  },

  getLangDescDataFromClient: (req) => {
    let langDescData = {
      author: req.token.id,
      description: req.body.description,
      title: req.body.title,
    };

    if (ramda.pathOr(false, ['documentMainLanguage', 'id'], req.body)) {
      langDescData = {
        ...langDescData,
        documentMainLanguage: {
          id: req.body.documentMainLanguage.id,
        },
      };
    }
    if (ramda.pathOr(false, ['titleAndDescriptionLanguage', 'id'], req.body)) {
      langDescData = {
        ...langDescData,
        titleAndDescriptionLanguage: {
          id: req.body.titleAndDescriptionLanguage.id,
        },
      };
    }

    return langDescData;
  },

  // Extract everything from the request body except id and dateInscription
  getConvertedDataFromClient: async (req) => {
    // Remove id if present to avoid null id (and an error)
    const { id, option, ...reqBodyWithoutId } = req.body;

    const optionFound = option
      ? await TOption.findOne({ name: option })
      : undefined;

    // Massif will be deleted in the future (a document can be about many massifs and a massif can be the subject of many documents): use massifs
    const massif = ramda.pathOr(undefined, ['massif', 'id'], req.body);
    const massifs = [
      ...ramda.propOr([], 'massifs', req.body),
      ...(massif ? [massif] : []),
    ];

    return {
      ...reqBodyWithoutId,
      authorizationDocument: ramda.pathOr(
        undefined,
        ['authorizationDocument', 'id'],
        req.body
      ),
      authors: req.body.authors ? req.body.authors.map((a) => a.id) : undefined,
      datePublication:
        req.body.publicationDate === '' ? null : req.body.publicationDate,
      editor: ramda.pathOr(undefined, ['editor', 'id'], req.body),
      identifierType: ramda.pathOr(
        undefined,
        ['identifierType', 'id'],
        req.body
      ),
      issue:
        req.body.issue && req.body.issue !== '' ? req.body.issue : undefined,
      library: ramda.pathOr(undefined, ['library', 'id'], req.body),
      license: ramda.pathOr(1, ['license', 'id'], req.body),
      massif,
      massifs,
      option: optionFound ? optionFound.id : undefined,
      parent: ramda.pathOr(undefined, ['partOf', 'id'], req.body),
      regions: req.body.regions ? req.body.regions.map((r) => r.id) : undefined,
      subjects: req.body.subjects
        ? req.body.subjects.map((s) => s.code)
        : undefined,
      type: ramda.pathOr(undefined, ['documentType', 'id'], req.body),
    };
  },

  // Set name of cave, entrance, massif, editor and library if present
  setNamesOfPopulatedDocument: async (document) => {
    if (!ramda.isNil(document.entrance))
      await NameService.setNames([document.entrance], 'entrance');
    if (!ramda.isNil(document.cave)) {
      await NameService.setNames([document.cave], 'cave');
    }
    if (!ramda.isNil(document.massif)) {
      await NameService.setNames([document.massif], 'massif');
    }
    if (!ramda.isNil(document.library)) {
      await NameService.setNames([document.library], 'grotto');
    }
    if (!ramda.isNil(document.editor)) {
      await NameService.setNames([document.editor], 'grotto');
    }
    await DescriptionService.setDocumentDescriptions(document);
    if (!ramda.isNil(document.authorizationDocument)) {
      await DescriptionService.setDocumentDescriptions(
        document.authorizationDocument
      );
    }
    return document;
  },
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
      (c) => c.parent === doc.id
    );
    const grandChildren = childrenAndGrandChildren.filter(
      (c) => c.parent !== doc.id
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
        (c) => c.id === grandChildDoc.parent
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
    doc.children = formattedChildren; // eslint-disable-line no-param-reassign
    return doc;
  },

  /**
   * Depending on the number of languages, return the document main language.
   * @param {TLanguage[]} languages
   * @returns main language of the document
   */
  getMainLanguage: (languages) => {
    if (languages) {
      if (languages.length === 0) {
        return undefined;
      }
      if (languages.length === 1) {
        return languages[0];
      }
      return languages.filter((l) => l.isMain);
    }
    return undefined;
  },

  getTopoFiles: async (docId) => {
    const files = await TFile.find({ document: docId });
    // Build path old
    return files.map((f) => ({
      ...f,
      pathOld: oldTopoFilesUrl + f.path,
    }));
  },

  updateDocument: async (req, newData, newDescriptionData, newFiles) => {
    const jsonData = {
      ...newData,
      ...newDescriptionData,
      id: req.param('id'),
      author: req.token.id,
      newFiles: ramda.isEmpty(newFiles) ? undefined : newFiles,
    };
    const updatedDocument = await TDocument.updateOne(req.param('id')).set({
      isValidated: false,
      dateValidation: null,
      dateReviewed: new Date(),
      modifiedDocJson: jsonData,
    });

    await NotificationService.notifySubscribers(
      req,
      updatedDocument,
      req.token.id,
      NOTIFICATION_TYPES.UPDATE,
      NOTIFICATION_ENTITIES.DOCUMENT
    );

    await DescriptionService.setDocumentDescriptions(updatedDocument, false);

    return updatedDocument;
  },

  createDocument: async (
    req,
    documentData,
    langDescData,
    shouldDownloadDistantFile = false
  ) => {
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
          langDescData
        ),
        dateReviewed: ramda.propOr(undefined, 'dateReviewed', langDescData),
        document: createdDocument.id,
        language: langDescData.titleAndDescriptionLanguage.id,
        title: langDescData.title,
      }).usingConnection(db);

      return createdDocument;
    });

    const populatedDocument = await module.exports.getDocument(
      document.id,
      false
    );

    if (
      populatedDocument.identifier &&
      ramda.pathOr('', ['identifierType', 'id'], populatedDocument).trim() ===
        'url'
    ) {
      sails.log.info(`Downloading ${populatedDocument.identifier}...`);
      const acceptedFileFormats = await TFileFormat.find();

      if (shouldDownloadDistantFile) {
        // Download distant file & tolerate error
        const file = await sails.helpers.distantFileDownload
          .with({
            url: populatedDocument.identifier,
            acceptedFileFormats: acceptedFileFormats.map((f) =>
              f.extension.trim()
            ),
            refusedFileFormats: ['html'], // don't download html page, they are not a valid file for GC
          })
          .tolerate((error) =>
            sails.log.error(
              `Failed to download ${populatedDocument.identifier}: ${error.message}`
            )
          );
        if (file) {
          await FileService.create(file, document.id);
        }
      }
    }

    await NotificationService.notifySubscribers(
      req,
      populatedDocument,
      req.token.id,
      NOTIFICATION_TYPES.CREATE,
      NOTIFICATION_ENTITIES.DOCUMENT
    );

    return populatedDocument;
  },

  /**
   * Populate any document-like object.
   * Avoid using when possible. Mainly used for json column that cannot be populated
   * using waterline query language.
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
    doc.parent = parent
      ? await TDocument.findOne(parent).populate('descriptions')
      : null;
    doc.reviewer = reviewer ? await TCaver.findOne(reviewer) : null;
    doc.type = type ? await TType.findOne(type) : null;

    doc.author = author ? await TCaver.findOne(author) : null;
    doc.authors = authors
      ? await Promise.all(
          authors.map(async (a) => {
            const res = await TCaver.findOne(a);
            return res;
          })
        )
      : [];
    doc.languages = languages
      ? await Promise.all(
          languages.map(async (lang) => {
            const res = await TLanguage.findOne(lang);
            return res;
          })
        )
      : [];
    doc.regions = regions
      ? await Promise.all(
          regions.map(async (region) => {
            const res = await TRegion.findOne(region);
            return res;
          })
        )
      : [];
    doc.subjects = subjects
      ? await Promise.all(
          subjects.map(async (subject) => {
            const res = await TSubject.findOne(subject);
            return res;
          })
        )
      : [];
    return doc;
  },

  getDocument: async (documentId, setParentDescriptions = false) => {
    // Simple function currently but will be extended depending on needs
    const result = await TDocument.findOne(documentId)
      .populate('cave')
      .populate('entrance')
      .populate('files')
      .populate('identifierType')
      .populate('license')
      .populate('type');
    await DescriptionService.setDocumentDescriptions(
      result,
      setParentDescriptions
    );
    return result;
  },

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
    const descriptions = await DescriptionService.getHDescriptionsOfDocument(
      documentId
    );
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
