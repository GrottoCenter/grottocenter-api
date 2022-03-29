/**
 * DocumentController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const ramda = require('ramda');
const DescriptionService = require('../services/DescriptionService');
const DocumentService = require('../services/DocumentService');
const DocumentDuplicateService = require('../services/DocumentDuplicateService');
const ErrorService = require('../services/ErrorService');

// Tool methods
// Set name of cave, entrance, massif, editor and library if present
const setNamesOfPopulatedDocument = async (document) => {
  !ramda.isNil(document.entrance) &&
    (await NameService.setNames([document.entrance], 'entrance'));
  !ramda.isNil(document.cave) &&
    (await NameService.setNames([document.cave], 'cave'));
  !ramda.isNil(document.massif) &&
    (await NameService.setNames([document.massif], 'massif'));
  !ramda.isNil(document.library) &&
    (await NameService.setNames([document.library], 'grotto'));
  !ramda.isNil(document.editor) &&
    (await NameService.setNames([document.editor], 'grotto'));
  await DescriptionService.setDocumentDescriptions(document);
  !ramda.isNil(document.authorizationDocument) &&
    (await DescriptionService.setDocumentDescriptions(
      document.authorizationDocument,
    ));
  return document;
};

// Extract everything from the request body except id and dateInscription
const getConvertedDataFromClient = async (req) => {
  const { id, option, ...reqBodyWithoutId } = req.body; // remove id if present to avoid null id (and an error)

  const optionFound = option
    ? await TOption.findOne({ name: option })
    : undefined;

  return {
    ...reqBodyWithoutId,
    author: req.token.id,
    authorizationDocument: ramda.pathOr(
      undefined,
      ['authorizationDocument', 'id'],
      req.body,
    ),
    authors: req.body.authors ? req.body.authors.map((a) => a.id) : undefined,
    datePublication:
      req.body.publicationDate === '' ? null : req.body.publicationDate,
    editor: ramda.pathOr(undefined, ['editor', 'id'], req.body),
    identifierType: ramda.pathOr(undefined, ['identifierType', 'id'], req.body),
    issue: req.body.issue && req.body.issue !== '' ? req.body.issue : undefined,
    library: ramda.pathOr(undefined, ['library', 'id'], req.body),
    license: ramda.pathOr(1, ['license', 'id'], req.body),
    massif: ramda.pathOr(undefined, ['massif', 'id'], req.body),
    option: optionFound ? optionFound.id : undefined,
    parent: ramda.pathOr(undefined, ['partOf', 'id'], req.body),
    regions: req.body.regions ? req.body.regions.map((r) => r.id) : undefined,
    subjects: req.body.subjects
      ? req.body.subjects.map((s) => s.code)
      : undefined,
    type: ramda.pathOr(undefined, ['documentType', 'id'], req.body),
  };
};

const getLangDescDataFromClient = (req) => {
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
};

const getEsBody = (document) => {
  const { type, modifiedDocJson, ...docWithoutJsonAndType } = document;
  return {
    ...docWithoutJsonAndType,
    authors: document.authors
      ? document.authors.map((a) => a.nickname).join(', ')
      : null,
    'contributor id': document.author.id,
    'contributor nickname': document.author.nickname,
    date_part: document.datePublication // eslint-disable-line camelcase
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
  };
};

const getAdditionalESIndexFromDocumentType = (document) => {
  return document.type.name === 'Issue'
    ? 'document-issues'
    : document.type.name === 'Collection'
    ? 'document-collections'
    : '';
};

/**
 * Based on the logstash.conf file.
 * The document must be fully populated and with all its names set (@see setNamesOfPopulatedDocument).
 */
const addDocumentToElasticSearchIndexes = async (document) => {
  // const { type, ...documentWithoutType } = document; // "type" property is already used by ES, don't spread it.
  const esBody = getEsBody(document);

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
};

const deleteDocumentFromElasticsearchIndexes = async (document) => {
  await ElasticsearchService.deleteResource('documents', document.id);
  const additionalIndex = getAdditionalESIndexFromDocumentType(document);

  // Delete in document-collections-index or document-issues-index
  if (additionalIndex !== '') {
    await ElasticsearchService.deleteResource(additionalIndex, document.id);
  }
};

//TO DO: proper update
const updateDocumentInElasticSearchIndexes = async (document) => {
  await deleteDocumentFromElasticsearchIndexes(document);
  await addDocumentToElasticSearchIndexes(document);
};
/* _______________________________________

  The following functions are used to extract the relevant information from the import csv module.
  ________________________________________
*/

const getConvertedDocumentFromCsv = async (rawData, authorId) => {
  const doubleCheck = (args) =>
    sails.helpers.csvhelpers.doubleCheck.with({ data: rawData, ...args });
  const retrieveFromLink = sails.helpers.csvhelpers.retrieveFromLink.with;

  // License
  const rawLicence = doubleCheck({
    key: 'dct:rights/karstlink:licenseType',
  });
  const licence = await retrieveFromLink({ stringArg: rawLicence });
  const licenceDb = await TLicense.findOne({ name: licence });
  if (!licenceDb) {
    throw Error('This kind of license (' + licence + ') cannot be imported.');
  }

  // Creator(s)
  const rawCreators = rawData['dct:creator'].split('|');
  let checkedRawCreators = rawCreators[0] === '' ? [] : rawCreators; // Empty the first array value if it's an empty string to avoid iterating through it
  // For each creator, first check if there is a grotto of this name. If not, check for a caver. If not, create a caver.
  const creatorsPromises = checkedRawCreators.map(async (creatorRaw) => {
    const authorGrotto = await TName.find({
      name: await retrieveFromLink({ stringArg: creatorRaw }),
      grotto: { '!=': null },
    }).limit(1);
    // If a grotto is found, a name object is returned.
    // If it as a caver which is found, it returns a caver object
    if (authorGrotto.length === 0) {
      return {
        type: 'caver',
        value: await sails.helpers.csvhelpers.getCreator.with({
          creator: creatorRaw,
        }),
      };
    } else {
      return { type: 'grotto', value: authorGrotto[0] };
    }
  });
  const creators = await Promise.all(creatorsPromises);

  // Editor
  const editorsRaw = doubleCheck({
    key: 'dct:publisher',
    defaultValue: null,
  });
  let editorId = undefined;
  if (editorsRaw) {
    const editorsRawArray = editorsRaw.split('|');
    let editorName = '';
    for (const editorRaw of editorsRawArray) {
      const editorNameRaw = await retrieveFromLink({ stringArg: editorRaw });
      editorName += editorNameRaw.replace('_', ' ') + ', ';
    }
    editorName = editorName.slice(0, -2);
    const namesArray = await TName.find({
      name: editorName,
      grotto: { '!=': null },
    }).limit(1);
    switch (namesArray.length) {
      case 0:
        const paramsGrotto = {
          author: authorId,
          dateInscription: new Date(),
        };
        const nameGrotto = {
          text: editorName,
          language: doubleCheck({
            key: 'dc:language',
            defaultValue: 'eng',
            func: (value) => value.toLowerCase(),
          }),
          author: authorId,
        };
        const editorGrotto = await GrottoService.createGrotto(
          paramsGrotto,
          nameGrotto,
        );
        editorId = editorGrotto.id;
        break;
      default:
        const name = namesArray[0];
        editorId = name.grotto;
        break;
    }
  }

  // Doc type
  const typeData = doubleCheck({
    key: 'karstlink:documentType',
  });
  let typeId = undefined;
  if (typeData) {
    const typeCriteria = typeData.startsWith('http')
      ? { url: typeData }
      : { name: typeData };
    const type = await TType.findOne(typeCriteria);
    if (!type) {
      throw Error("The document type '" + typeData + "' is incorrect.");
    }
    typeId = type.id;
  }

  // Parent / partOf
  const parentId = doubleCheck({
    key: 'dct:isPartOf',
  });
  const doesParentExist = parentId
    ? await sails.helpers.checkIfExists.with({
        attributeName: 'id',
        attributeValue: parentId,
        sailsModel: TDocument,
      })
    : false;
  if (parentId && !doesParentExist) {
    throw Error('Document parent with id ' + parentId + ' not found.');
  }

  // Subjects
  const subjectsData = doubleCheck({
    key: 'dct:subject',
  });
  let subjects = subjectsData ? subjectsData.split('|') : undefined;

  const creatorsCaverId = [];
  const creatorsGrottoId = [];
  for (const creator of creators) {
    switch (creator.type) {
      case 'caver':
        creatorsCaverId.push(creator.value.id);
        break;
      case 'grotto':
        creatorsGrottoId.push(creator.value.grotto);
        break;
    }
  }

  return {
    author: authorId,
    authors: creatorsCaverId,
    authorsGrotto: creatorsGrottoId,
    dateInscription: doubleCheck({
      key: 'dct:rights/dct:created',
      defaultValue: new Date(),
    }),
    datePublication: doubleCheck({
      key: 'dct:date',
    }),
    dateReviewed: doubleCheck({
      key: 'dct:rights/dct:modified',
    }),
    editor: editorId,
    idDbImport: doubleCheck({
      key: 'id',
    }),
    identifier: doubleCheck({
      key: 'dct:source',
    }),
    identifierType: doubleCheck({
      key: 'dct:identifier',
      func: (value) => value.trim().toLowerCase(),
    }),
    license: licenceDb.id,
    nameDbImport: doubleCheck({
      key: 'dct:rights/cc:attributionName',
    }),
    parent: parentId,
    subjects: subjects,
    type: typeId,
  };
};

const getConvertedLangDescDocumentFromCsv = (rawData, authorId) => {
  const doubleCheck = (args) =>
    sails.helpers.csvhelpers.doubleCheck.with({ data: rawData, ...args });
  const description = doubleCheck({
    key: 'karstlink:hasDescriptionDocument/dct:description',
  });
  const langDesc = description
    ? doubleCheck({
        key: 'karstlink:hasDescriptionDocument/dc:language',
        func: (value) => value.toLowerCase(),
      })
    : doubleCheck({
        key: 'dc:language',
        func: (value) => value.toLowerCase(),
      });
  return {
    author: authorId,
    title: doubleCheck({
      key: 'rdfs:label',
    }),
    description: description,
    dateInscription: doubleCheck({
      key: 'dct:rights/dct:created',
      defaultValue: new Date(),
    }),
    dateReviewed: doubleCheck({
      key: 'dct:rights/dct:modified',
    }),
    documentMainLanguage: {
      id: doubleCheck({
        key: 'dc:language',
        func: (value) => value.toLowerCase(),
      }),
    },
    titleAndDescriptionLanguage: {
      id: langDesc,
    },
  };
};

module.exports = {
  count: (req, res) => {
    TDocument.count().exec((err, found) => {
      const params = {};
      params.controllerMethod = 'DocumentController.count';
      params.notFoundMessage = 'Problem while getting number of documents.';

      const count = {};
      count.count = found;
      return ControllerService.treat(req, err, count, params, res);
    });
  },

  countBBS: (req, res) => {
    TDocument.count()
      .where({
        refBbs: { '!=': null },
      })
      .exec((err, found) => {
        const params = {};
        params.controllerMethod = 'DocumentController.countBBS';
        params.notFoundMessage =
          'Problem while getting number of BBS documents.';

        const count = {};
        count.count = found;
        return ControllerService.treat(req, err, count, params, res);
      });
  },

  create: async (req, res) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.DOCUMENT,
        rightAction: RightService.RightActions.CREATE,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to create a document.',
        );
      });
    if (!hasRight) {
      return res.forbidden('You are not authorized to create a document.');
    }

    const dataFromClient = await getConvertedDataFromClient(req);

    const cleanedData = {
      ...dataFromClient,
      dateInscription: new Date(),
    };

    const langDescData = getLangDescDataFromClient(req);

    try {
      const createdDocument = await DocumentService.createDocument(
        cleanedData,
        langDescData,
      );
      const errorFiles = [];
      if (req.files && req.files.files) {
        const { files } = req.files;
        for (const file of files) {
          try {
            await FileService.create(file, createdDocument.id);
          } catch (err) {
            errorFiles.push({
              fileName: file.originalname,
              error: err.toString(),
            });
          }
        }
      }

      const requestResponse = {
        document: createdDocument,
        status: !ramda.isEmpty(errorFiles)
          ? {
              errorCode: 'FileNotImported',
              errorString: 'Some files were not imported.',
              content: errorFiles,
            }
          : undefined,
      };

      const params = {};
      params.controllerMethod = 'DocumentController.create';
      return ControllerService.treat(req, null, requestResponse, params, res);
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
    }
  },

  update: async (req, res) => {
    const docWithModif = await TDocument.findOne({
      id: req.param('id'),
      modifiedDocJson: { '!=': null },
    });
    const rightAction = docWithModif
      ? RightService.RightActions.EDIT_NOT_VALIDATED
      : RightService.RightActions.EDIT_ANY;
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.DOCUMENT,
        rightAction: rightAction,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to update a document.',
        );
      });

    if (!hasRight) {
      return res.forbidden('You are not authorized to update a document.');
    }

    // Add new files
    const newFilesArray = [];
    if (req.files && req.files.files) {
      const { files } = req.files;
      for (const file of files) {
        try {
          const createdFile = await FileService.create(
            file,
            req.param('id'),
            true,
            false,
          );
          newFilesArray.push(createdFile);
        } catch (err) {
          return res.serverError(err);
        }
      }
    }

    // Update json data (upcoming modifications which need to be validated)
    const dataFromClient = await getConvertedDataFromClient(req);
    const descriptionData = await getLangDescDataFromClient(req);
    const jsonData = {
      ...dataFromClient,
      ...descriptionData,
      id: req.param('id'),
      author: req.token.id,
      newFiles: ramda.isEmpty(newFilesArray) ? undefined : newFilesArray,
    };
    try {
      const updatedDocument = await TDocument.updateOne(req.param('id')).set({
        isValidated: false,
        dateValidation: null,
        dateReviewed: new Date(),
        modifiedDocJson: jsonData,
      });
      if (!updatedDocument) {
        return res.status(404);
      }

      await DescriptionService.setDocumentDescriptions(updatedDocument, false);
      const params = {};
      params.controllerMethod = 'DocumentController.update';
      return ControllerService.treatAndConvert(
        req,
        null,
        updatedDocument,
        params,
        res,
        MappingV1Service.convertToDocumentModel,
      );
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
    }
  },

  updateWithNewEntities: async (req, res) => {
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.DOCUMENT,
        rightAction: RightService.RightActions.EDIT_ANY,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to update a document.',
        );
      });

    if (!hasRight) {
      return res.forbidden('You are not authorized to update a document.');
    }

    // Check if entrance exists
    const documentId = req.param('id');
    const currentDocument = await TDocument.findOne(documentId);
    if (!currentDocument) {
      return res.status(404).send({
        message: `Entrance of id ${documentId} not found.`,
      });
    }

    const { document, newAuthors, newDescriptions } = req.body;

    const cleanedData = {
      ...document,
      id: documentId,
    };

    const checkForEmptiness = (value) => value && !ramda.isEmpty(value);

    // For each associated entites :
    // - check if there are new values
    // - create the corresponding values
    // - add the newly created values to the array of cleanedData
    //   otherwise, when the update will be done based on cleanedData, the relation will be deleted
    try {
      if (checkForEmptiness(newAuthors)) {
        const authorParams = newAuthors.map((author) => ({
          ...author,
          documents: [documentId],
        }));
        const createdAuthors = await TCaver.createEach(authorParams).fetch();
        const createdAuthorsIds = createdAuthors.map((author) => author.id);
        cleanedData.authors = ramda.concat(
          cleanedData.authors,
          createdAuthorsIds,
        );
      }

      if (checkForEmptiness(newDescriptions)) {
        const descParams = newDescriptions.map((desc) => ({
          ...desc,
          document: documentId,
        }));
        const createdDescriptions = await TDescription.createEach(
          descParams,
        ).fetch();
        const createdDescriptionsIds = createdDescriptions.map(
          (desc) => desc.id,
        );
        cleanedData.descriptions = ramda.concat(
          cleanedData.descriptions,
          createdDescriptionsIds,
        );
      }
      const updatedDocument = await TDocument.updateOne(documentId).set(
        cleanedData,
      );

      return res.ok(updatedDocument);
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
    }
  },

  findAll: async (
    req,
    res,
    next,
    converter = MappingV1Service.convertToDocumentList,
  ) => {
    // By default get only the validated ones
    const isValidated = req.param('isValidated')
      ? !(req.param('isValidated').toLowerCase() === 'false')
      : true;

    const sort = `${req.param('sortBy', 'dateInscription')} ${req.param(
      'orderBy',
      'ASC',
    )}`;

    /*
      4 possible cases : isValidated (true or false) AND validation (null or not)
      If the document is not validated and has a dateValidation, it means that it has been refused.
      We don't want to retrieve these documents refused.
      So when isValidated is false, we need to retrieve only the document with a dateValidation set to null
      (= submitted documents which need to be reviewed).
    */
    const whereClause = {
      and: [{ isValidated: isValidated }],
    };
    !isValidated && whereClause.and.push({ dateValidation: null });

    const type = req.param('documentType');
    const foundType = type ? await TType.findOne({ name: type }) : null;
    foundType && whereClause.and.push({ type: foundType.id });

    TDocument.find()
      .where(whereClause)
      .skip(req.param('skip', 0))
      .limit(req.param('limit', 50))
      .sort(sort)
      .populate('author')
      .populate('authorizationDocument')
      .populate('authors')
      .populate('cave')
      .populate('descriptions')
      .populate('editor')
      .populate('entrance')
      .populate('files')
      .populate('identifierType')
      .populate('library')
      .populate('license')
      .populate('massif')
      .populate('option')
      .populate('parent')
      .populate('regions')
      .populate('reviewer')
      .populate('subjects')
      .populate('type')
      .exec((err, found) => {
        TDocument.count()
          .where(whereClause)
          .exec(async (err, countFound) => {
            if (err) {
              sails.log.error(err);
              return res.serverError('An unexpected server error occured.');
            }

            if (found.length === 0) {
              return res.status(200).send({
                documents: [],
                message: `There is no document matching your criterias. It can be because sorting by ${sort} is not supported.`,
              });
            }

            await Promise.all(
              found.map(async (doc) => {
                doc.mainLanguage = await DocumentService.getMainLanguage(
                  doc.id,
                );
                await NameService.setNames(
                  [
                    ...(doc.library ? [doc.library] : []),
                    ...(doc.editor ? [doc.editor] : []),
                  ],
                  'grotto',
                );
                doc.authorizationDocument &&
                  (await DescriptionService.setDocumentDescriptions(
                    doc.authorizationDocument,
                  ));
                await setNamesOfPopulatedDocument(doc);
                doc.children &&
                  (await Promise.all(
                    doc.children.map(async (childDoc) => {
                      await DescriptionService.setDocumentDescriptions(
                        childDoc,
                      );
                    }),
                  ));
              }),
            );

            const params = {
              controllerMethod: 'DocumentController.findAll',
              limit: req.param('limit', 50),
              searchedItem: 'All documents',
              skip: req.param('skip', 0),
              total: countFound,
              url: req.originalUrl,
            };
            return ControllerService.treatAndConvert(
              req,
              err,
              found,
              params,
              res,
              converter,
            );
          });
      });
  },

  findByCaverId: async (
    req,
    res,
    next,
    converter = MappingV1Service.convertToDocumentList,
  ) => {
    const caverId = req.param('caverId');

    const sort = `${req.param('sortBy', 'dateInscription')} ${req.param(
      'orderBy',
      'ASC',
    )}`;

    const whereClause = {
      and: [{ author: caverId }],
    };

    TDocument.find()
      .where(whereClause)
      .skip(req.param('skip', 0))
      .limit(req.param('limit', 50))
      .sort(sort)
      .populate('author')
      .populate('authors')
      .populate('cave')
      .populate('children')
      .populate('descriptions')
      .populate('editor')
      .populate('entrance')
      .populate('files')
      .populate('identifierType')
      .populate('library')
      .populate('license')
      .populate('massif')
      .populate('parent')
      .populate('regions')
      .populate('reviewer')
      .populate('subjects')
      .populate('type')
      .exec(async (err, documents) => {
        if (err) {
          sails.log.error(err);
          return res.serverError('An unexpected server error occured.');
        }

        if (documents.length === 0) {
          return res.status(200).send({
            documents: [],
            message: `There is no document matching your criterias.`,
          });
        }

        try {
          for (doc of documents) {
            doc.mainLanguage = await DocumentService.getMainLanguage(doc.id);
            await setNamesOfPopulatedDocument(doc);
            doc.children &&
              (await Promise.all(
                doc.children.map(async (childDoc) => {
                  await DescriptionService.setDocumentDescriptions(childDoc);
                }),
              ));
          }

          const totalNb = await TDocument.count().where(whereClause);
          const params = {
            controllerMethod: 'DocumentController.findByCaverId',
            limit: req.param('limit', 50),
            searchedItem: 'All documents',
            skip: req.param('skip', 0),
            total: totalNb,
            url: req.originalUrl,
          };
          return ControllerService.treatAndConvert(
            req,
            err,
            documents,
            params,
            res,
            converter,
          );
        } catch (e) {
          ErrorService.getDefaultErrorHandler(res)(e);
        }
      });
  },

  find: async (
    req,
    res,
    next,
    converter = MappingV1Service.convertToDocumentModel,
  ) => {
    let found;
    let err;
    if (req.param('requireUpdate') === 'true') {
      const { id, modifiedDocJson } = await TDocument.findOne(req.param('id'));
      if (modifiedDocJson === null) {
        return res.serverError('This document has not been updated.');
      }
      try {
        const {
          title,
          description,
          titleAndDescriptionLanguage,
          descriptions,
          documentMainLanguage,
          newFiles,
          modifiedFiles,
          deletedFiles,
          ...otherData
        } = modifiedDocJson;
        const populatedDoc = await DocumentService.populateJSON(
          cleanedDocument,
        );
        found = { ...populatedDoc, id };

        // Join the tables
        found = { ...otherData, id };
        found.author = author ? await TCaver.findOne(author) : null;
        found.authorizationDocument = authorizationDocument
          ? await TDocument.findOne(authorizationDocument)
          : null;
        found.cave = cave ? await TCave.findOne(cave) : null;
        found.editor = editor ? await TGrotto.findOne(editor) : null;
        found.entrance = entrance ? await TEntrance.findOne(entrance) : null;
        found.identifierType = identifierType
          ? await TIdentifierType.findOne(identifierType)
          : null;
        found.library = library ? await TGrotto.findOne(library) : null;
        found.license = license ? await TLicense.findOne(license) : null;
        found.massif = massif ? await TMassif.findOne(massif) : null;
        found.option = option ? await TOption.findOne(option) : null;
        found.parent = parent ? await TDocument.findOne(parent) : null;
        found.reviewer = reviewer ? await TCaver.findOne(reviewer) : null;
        found.type = type ? await TType.findOne(type) : null;

        // Collections
        found.subjects = subjects
          ? await Promise.all(
              subjects.map(async (subject) => {
                return await TSubject.findOne(subject);
              }),
            )
          : [];
        found.authors = authors
          ? await Promise.all(
              authors.map(async (author) => {
                return await TCaver.findOne(author);
              }),
            )
          : [];
        found.regions = regions
          ? await Promise.all(
              regions.map(async (region) => {
                return await TRegion.findOne(region);
              }),
            )
          : [];

        // Files retrieval

        let filesCriterias = {
          document: id,
          isValidated: true,
        };
        // Don't retrieve files which are modified, new or deleted (because we already have them).
        // New are those which have isValidated = false
        let filesToIgnore = modifiedFiles || [];
        filesToIgnore =
          (deletedFiles && ramda.concat(filesToIgnore, deletedFiles)) ||
          filesToIgnore;
        const filesToIgnoreId = filesToIgnore.map((file) => file.id);

        if (!ramda.isEmpty(filesToIgnoreId)) {
          filesCriterias = {
            document: id,
            id: { '!=': filesToIgnoreId },
            isValidated: true,
          };
        }
        const files = await TFile.find(filesCriterias);
        found.files = files;
        found.newFiles = newFiles;
        found.deletedFiles = deletedFiles;
        found.modifiedFiles = modifiedFiles;

        // We can only modify the main language, so we don't have a "languages" attribute stored in the json. Uncomment if the possibility to add language is implemented.
        // found.languages = languages ? await Promise.all(languages.map(async (language) => { return await TLanguage.findOne(language)})) : [];
        found.mainLanguage = await TLanguage.findOne(documentMainLanguage);

        // Populate names & descriptions
        await NameService.setNames([found.editor], 'grotto');
        await DescriptionService.setDocumentDescriptions(found.parent, false);

        // Handle the description because even if it has been modified, the entry in TDescription stayed intact.
        const descLang = await TLanguage.findOne(titleAndDescriptionLanguage);
        found.descriptions = [];
        found.descriptions.push({
          author: author,
          title: title,
          body: description,
          document: id,
          language: descLang,
        });
      } catch (e) {
        ErrorService.getDefaultErrorHandler(res)(e);
      }
    } else {
      found = await TDocument.findOne(req.param('id'))
        .populate('author')
        .populate('authorizationDocument')
        .populate('authors')
        .populate('cave')
        .populate('descriptions')
        .populate('editor')
        .populate('entrance')
        .populate('files', {
          where: {
            isValidated: true,
          },
        })
        .populate('identifierType')
        .populate('languages')
        .populate('library')
        .populate('license')
        .populate('massif')
        .populate('option')
        .populate('parent')
        .populate('regions')
        .populate('reviewer')
        .populate('subjects')
        .populate('type');
      const params = {
        controllerMethod: 'DocumentController.find',
        searchedItem: 'Document of id ' + req.param('id'),
      };
      if (!found) {
        const notFoundMessage = `${params.searchedItem} not found`;
        sails.log.debug(notFoundMessage);
        return res.status(404).send(notFoundMessage);
      }
      found.mainLanguage = await DocumentService.getMainLanguage(found.id);
      await setNamesOfPopulatedDocument(found);
      await DescriptionService.setDocumentDescriptions(found);
    }

    const params = {
      controllerMethod: 'DocumentController.find',
      searchedItem: 'Document of id ' + req.param('id'),
    };

    if (!found) {
      const notFoundMessage = `${params.searchedItem} not found`;
      sails.log.debug(notFoundMessage);
      res.status(404);
      return res.json({ error: notFoundMessage });
    }

    return ControllerService.treatAndConvert(
      req,
      err,
      found,
      params,
      res,
      converter,
    );
  },

  validate: (req, res, next) => {
    const isValidated = req.param('isValidated')
      ? !(req.param('isValidated').toLowerCase() === 'false')
      : true;
    const validationComment = req.param('validationComment', null);
    const id = req.param('id');

    if (isValidated === false && !validationComment) {
      return res.badRequest(
        `If the document with id ${req.param(
          'id',
        )} is refused, a comment must be provided.`,
      );
    }

    TDocument.updateOne({ id: id })
      .set({
        dateValidation: new Date(),
        isValidated: isValidated,
        validationComment: validationComment,
        validator: req.token.id,
      })
      .then(async (updatedDocument) => {
        if (isValidated) {
          const populatedDoc = await Tdocument.findOne(updatedDocument.id)
            .populate('author')
            .populate('authors')
            .populate('cave')
            .populate('descriptions')
            .populate('editor')
            .populate('entrance')
            .populate('identifierType')
            .populate('languages')
            .populate('library')
            .populate('license')
            .populate('massif')
            .populate('parent')
            .populate('regions')
            .populate('reviewer')
            .populate('subjects')
            .populate('type');
          await setNamesOfPopulatedDocument(populatedDoc);
          await addDocumentToElasticSearchIndexes(updatedDocument);
        }

        const params = {
          controllerMethod: 'DocumentController.validate',
          notFoundMessage: `Document of id ${id} not found`,
          searchedItem: `Document of id ${id}`,
        };
        return ControllerService.treat(req, null, updatedDocument, params, res);
      });
  },

  multipleValidate: async (req, res, next) => {
    const documents = req.param('documents');
    const updatePromises = [];
    documents.map((doc) => {
      const isValidated = doc.isValidated
        ? !(doc.isValidated.toLowerCase() === 'false')
        : true;
      const { validationComment } = doc;
      const { id } = doc;

      if (isValidated === false && !validationComment) {
        return res.badRequest(
          `If the document with id ${req.param(
            'id',
          )} is refused, a comment must be provided.`,
        );
      }

      updatePromises.push(
        TDocument.updateOne({ id: id }).set({
          dateValidation: new Date(),
          isValidated: isValidated,
          validationComment: validationComment,
          validator: req.token.id,
        }),
      );
    });

    try {
      await Promise.all(updatePromises).then(async (results) => {
        for (const doc of results) {
          const isAModifiedDoc = doc.modifiedDocJson ? true : false;
          if (doc.isValidated) {
            // If there is modified doc stored in the json column, we update the document with the data contained in it. Then we remove the json.
            if (isAModifiedDoc) {
              // Launch update request using transaction: it performs a rollback if an error occurs
              await sails
                .getDatastore()
                .transaction(async (db) => {
                  const {
                    documentMainLanguage,
                    author,
                    description,
                    titleAndDescriptionLanguage,
                    title,
                    modifiedFiles,
                    deletedFiles,
                    newFiles,
                    ...cleanedData
                  } = doc.modifiedDocJson;
                  cleanedData.modifiedDocJson = null;
                  const updatedDocument = await TDocument.updateOne(doc.id)
                    .set(cleanedData)
                    .usingConnection(db);
                  if (!updatedDocument) {
                    return res.status(404);
                  }

                  // Update associated data not handled by TDocument manually
                  if (documentMainLanguage) {
                    await JDocumentLanguage.updateOne({
                      document: updatedDocument.id,
                    })
                      .set({
                        document: updatedDocument.id,
                        language: documentMainLanguage.id,
                        isMain: true,
                      })
                      .usingConnection(db);
                  }

                  await TDescription.updateOne({ document: updatedDocument.id })
                    .set({
                      author: author,
                      body: description,
                      document: updatedDocument.id,
                      language: titleAndDescriptionLanguage.id,
                      title: title,
                    })
                    .usingConnection(db);

                  // New files have already been created, they just need to be linked to the document.
                  if (newFiles) {
                    const newPromises = newFiles.map(async (file) => {
                      return await TFile.updateOne(file.id).set({
                        isValidated: true,
                      });
                    });
                    await Promise.all(newPromises);
                  }
                  if (modifiedFiles) {
                    const modificationPromises = modifiedFiles.map(
                      async (file) => {
                        return await FileService.update(file);
                      },
                    );
                    await Promise.all(modificationPromises);
                  }

                  if (deletedFiles) {
                    const deletionPromises = deletedFiles.map(async (file) => {
                      return await FileService.delete(file);
                    });
                    await Promise.all(deletionPromises);
                  }
                })
                .intercept((err) =>
                  ErrorService.getDefaultErrorHandler(res)(err),
                );
            }
            // Get full document an index it in Elasticsearch
            try {
              const found = await TDocument.findOne(doc.id)
                .populate('author')
                .populate('authorizationDocument')
                .populate('authors')
                .populate('cave')
                .populate('descriptions')
                .populate('editor')
                .populate('entrance')
                .populate('identifierType')
                .populate('languages')
                .populate('library')
                .populate('license')
                .populate('massif')
                .populate('option')
                .populate('parent')
                .populate('regions')
                .populate('reviewer')
                .populate('subjects')
                .populate('type');
              await setNamesOfPopulatedDocument(found);
              isAModifiedDoc
                ? updateDocumentInElasticSearchIndexes(found)
                : addDocumentToElasticSearchIndexes(found);
            } catch (err) {
              return res.serverError(
                'An error occured when trying to get all information about the document.',
              );
            }
          } else {
            /* 
          If the document refused, check if there is a json document. 
          If there is one, remove it and validate the document 
          because the document kept the same values as when it was validated (the modified data was in the json).
          */
            if (isAModifiedDoc) {
              await TDocument.updateOne(doc.id).set({
                isValidated: true,
                modifiedDocJson: null,
              });
            }
          }
        }
      });
      return res.ok();
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
    }
  },

  checkRows: async (req, res) => {
    const doubleCheck = sails.helpers.csvhelpers.doubleCheck.with;
    const willBeCreated = [];
    const willBeCreatedAsDuplicates = [];
    const wontBeCreated = [];
    for (const [index, row] of req.body.data.entries()) {
      const idDb = doubleCheck({
        data: row,
        key: 'id',
      });
      const nameDb = doubleCheck({
        data: row,
        key: 'dct:rights/cc:attributionName',
      });

      // Stop if no id and name provided
      if (!(idDb && nameDb)) {
        wontBeCreated.push({
          line: index + 2,
        });
        continue;
      }

      // Check for duplicates
      const result = await TDocument.find({
        idDbImport: idDb,
        nameDbImport: nameDb,
        isDeleted: false,
      });
      if (result.length === 0) {
        willBeCreated.push(row);
      } else {
        willBeCreatedAsDuplicates.push(row);
      }
    }

    const requestResult = {
      willBeCreated,
      willBeCreatedAsDuplicates,
      wontBeCreated,
    };
    return res.ok(requestResult);
  },

  importRows: async (req, res) => {
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.DOCUMENT,
        rightAction: RightService.RightActions.CSV_IMPORT,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to import documents via CSV.',
        );
      });
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to import documents via CSV.',
      );
    }

    const doubleCheck = sails.helpers.csvhelpers.doubleCheck.with;
    const requestResponse = {
      type: 'document',
      total: {
        success: 0,
        failure: 0,
      },
      successfulImport: [],
      successfulImportAsDuplicates: [],
      failureImport: [],
    };

    for (const [index, data] of req.body.data.entries()) {
      const missingColumns = await sails.helpers.csvhelpers.checkColumns.with({
        data: data,
      });
      // Stop if missing columnes
      if (missingColumns.length > 0) {
        requestResponse.failureImport.push({
          line: index + 2,
          message: 'Columns missing : ' + missingColumns.toString(),
        });
        continue;
      }

      // Check for duplicates
      const idDb = doubleCheck({
        data: data,
        key: 'id',
      });
      const nameDb = doubleCheck({
        data: data,
        key: 'dct:rights/cc:attributionName',
      });

      const result = await TDocument.find({
        idDbImport: idDb,
        nameDbImport: nameDb,
        isDeleted: false,
      });

      // Data formatting
      // Author retrieval : create one if not present in db
      const authorId = await sails.helpers.csvhelpers.getAuthor.with({
        data: data,
      });
      const dataDocument = await getConvertedDocumentFromCsv(data, authorId);
      const dataLangDesc = getConvertedLangDescDocumentFromCsv(data, authorId);

      if (result.length !== 0) {
        // Create a duplicate in DB
        const duplicateContent = {
          document: dataDocument,
          description: dataLangDesc,
        };
        await DocumentDuplicateService.create(
          req.token.id,
          duplicateContent,
          result[0].id,
        );
        requestResponse.successfulImportAsDuplicates.push({
          line: index + 2,
          message: `Document with id ${idDb} has been created as a document duplicate.`,
        });
        continue;
      }

      try {
        const createdDocument = await DocumentService.createDocument(
          dataDocument,
          dataLangDesc,
        );
        const docFiles = await TFile.find({ document: createdDocument.id });
        requestResponse.successfulImport.push({
          documentId: createdDocument.id,
          title: dataLangDesc.title,
          filesImported: docFiles.map((f) => f.fileName).join(','),
        });
      } catch (err) {
        sails.log.error(err);
        requestResponse.failureImport.push({
          line: index + 2,
          message: err.toString(),
        });
      }
    }

    requestResponse.total.success = requestResponse.successfulImport.length;
    requestResponse.total.successfulImportAsDuplicates =
      requestResponse.successfulImportAsDuplicates.length;
    requestResponse.total.failure = requestResponse.failureImport.length;
    return res.ok(requestResponse);
  },

  findChildren: async (
    req,
    res,
    converter = MappingV1Service.convertToDocumentList,
  ) => {
    // Check param
    if (
      !(await sails.helpers.checkIfExists.with({
        attributeName: 'id',
        attributeValue: req.param('id'),
        sailsModel: TDocument,
      }))
    ) {
      return res.badRequest(
        `Could not find document with id ${req.param('id')}.`,
      );
    }

    const doc = { id: Number(req.param('id')) };
    await DocumentService.deepPopulateChildren(doc);

    const params = {
      controllerMethod: 'DocumentController.findChildren',
      searchedItem: 'Children of document with id ' + req.param('id'),
    };
    return ControllerService.treatAndConvert(
      req,
      null,
      doc.children,
      params,
      res,
      converter,
    );
  },
};
