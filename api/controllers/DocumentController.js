/**
 * DocumentController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const ramda = require('ramda');
const getCountryISO3 = require('country-iso-2-to-3');
const DocumentService = require('../services/DocumentService');

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
    titleAndDescriptionLanguage: {
      id: req.body.titleAndDescriptionLanguage.id,
    },
  };

  if (ramda.pathOr(null, ['documentMainLanguage', 'id'], req.body)) {
    langDescData = {
      ...langDescData,
      documentMainLanguage: {
        id: req.body.documentMainLanguage.id,
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
  const additionalIndex =
    document.type.name === 'Issue'
      ? 'document-issues'
      : document.type.name === 'Collection'
      ? 'document-collections'
      : '';
  if (additionalIndex !== '') {
    await ElasticsearchService.create(additionalIndex, document.id, {
      ...esBody,
      tags: [`document-${document.type.name.toLowerCase()}`],
    });
  }
};

//TO DO: proper update
const updateDocumentInElasticSearchIndexes = async (document) => {
  await ElasticsearchService.deleteResource('documents', document.id);
  await addDocumentToElasticSearchIndexes(document);
};
/* _______________________________________

  The following functions are used to extract the relevant information from the import csv module.
  ________________________________________
*/

const countryIso2ToIso3 = (iso) => {
  if (iso !== undefined) {
    if (iso === 'EN') {
      return 'eng';
    }
    const res = getCountryISO3(iso);
    if (res) {
      return res.toLowerCase();
    } else {
      throw Error('This iso code is incorrect : ' + iso);
    }
  }
  return null;
};

const getConvertedDocumentFromCsv = async (rawData, authorId) => {
  const doubleCheck = sails.helpers.csvhelpers.doubleCheck.with;
  const retrieveFromLink = sails.helpers.csvhelpers.retrieveFromLink.with;

  // License
  const rawLicence = doubleCheck({
    data: rawData,
    key: 'dct:rights/karstlink:licenseType',
    defaultValue: undefined,
  });
  const licence = await retrieveFromLink({ stringArg: rawLicence });
  const licenceDb = await TLicense.findOne({ name: licence });
  if (!licenceDb) {
    throw Error('This kind of license (' + licence + ') cannot be imported.');
  }

  // Creator
  const creatorsRaw = rawData['dct:creator'].split('|');
  // For each creator, first check if there is a grotto of this name. If not, check for a caver. If not, create a caver.
  const creatorsPromises = creatorsRaw.map(async (creatorRaw) => {
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
    data: rawData,
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
            data: rawData,
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
    data: rawData,
    key: 'karstlink:documentType',
    defaultValue: undefined,
  });
  let typeId = undefined;
  if (typeData) {
    const typeCriteria = typeData.startsWith('http')
      ? { url: typeData }
      : { name: typeData };
    const type = await TType.findOne(typeCriteria);
    if (!type) {
      throw Error("The document type '" + typeDate + "' is incorrect.");
    }
    typeId = type.id;
  }

  // Parent / partOf
  const parentData = doubleCheck({
    data: rawData,
    key: 'dct:isPartOf',
    defaultValue: undefined,
  });
  let parent = undefined;
  if (parentData) {
    const descArray = await TDescription.find({
      title: parentData,
      document: { '!=': null },
    }).limit(1);
    if (descArray.length > 0) {
      parent = descArray[0].document;
    }
  }

  // Subjects
  const subjectsData = doubleCheck({
    data: rawData,
    key: 'dct:subject',
    defaultValue: undefined,
  });
  let subjects = undefined;
  if (subjectsData) {
    subjects = subjectsData.split('|');
  }

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
    datePublication: doubleCheck({
      data: rawData,
      key: 'dct:date',
      defaultValue: undefined,
    }),
    identifierType: doubleCheck({
      data: rawData,
      key: 'dct:identifier',
      defaultValue: undefined,
      func: (value) => value.trim().toLowerCase(),
    }),
    identifier: doubleCheck({
      data: rawData,
      key: 'dct:source',
      defaultValue: undefined,
    }),
    license: licenceDb.id,
    dateInscription: doubleCheck({
      data: rawData,
      key: 'dct:rights/dct:created',
      defaultValue: new Date(),
    }),
    dateReviewed: doubleCheck({
      data: rawData,
      key: 'dct:rights/dct:modified',
      defaultValue: undefined,
    }),
    authors: creatorsCaverId,
    authorsGrotto: creatorsGrottoId,
    editor: editorId,
    type: typeId,
    parent: parent,
    subjects: subjects,
    idDbImport: doubleCheck({
      data: rawData,
      key: 'id',
      defaultValue: undefined,
    }),
    nameDbImport: doubleCheck({
      data: rawData,
      key: 'dct:rights/cc:attributionName',
      defaultValue: undefined,
    }),
  };
};

const getConvertedLangDescDocumentFromCsv = (rawData, authorId) => {
  const doubleCheck = sails.helpers.csvhelpers.doubleCheck.with;
  const desc = doubleCheck({
    data: rawData,
    key: 'karstlink:hasDescriptionDocument/dct:description',
    defaultValue: undefined,
  });
  const langDesc = desc
    ? doubleCheck({
        data: rawData,
        key: 'karstlink:hasDescriptionDocument/dc:language',
        defaultValue: undefined,
        func: (value) => value.toLowerCase(),
      })
    : doubleCheck({
        data: rawData,
        key: 'dc:language',
        defaultValue: undefined,
        func: (value) => value.toLowerCase(),
      });
  return {
    author: authorId,
    title: doubleCheck({
      data: rawData,
      key: 'rdfs:label',
      defaultValue: undefined,
    }),
    description: doubleCheck({
      data: rawData,
      key: 'karstlink:hasDescriptionDocument/dct:description',
      defaultValue: undefined,
    }),
    dateInscription: doubleCheck({
      data: rawData,
      key: 'dct:rights/dct:created',
      defaultValue: new Date(),
    }),
    dateReviewed: doubleCheck({
      data: rawData,
      key: 'dct:rights/dct:modified',
      defaultValue: undefined,
    }),
    documentMainLanguage: {
      id: doubleCheck({
        data: rawData,
        key: 'dc:language',
        defaultValue: undefined,
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

    const resultConversion = await getConvertedDataFromClient(req);

    const cleanedData = {
      ...resultConversion,
      dateInscription: new Date(),
    };

    const langDescData = getLangDescDataFromClient(req);

    const handleError = (error) => {
      if (error.code && error.code === 'E_UNIQUE') {
        return res.sendStatus(409);
      } else {
        switch (error.name) {
          case 'UsageError':
            return res.badRequest(error.message);
          case 'AdapterError':
            return res.badRequest(error.message);
          default:
            return res.serverError(error.message);
        }
      }
    };

    const documentCreated = await DocumentService.createDocument(
      cleanedData,
      langDescData,
      handleError,
    );
    const errorFiles = [];
    if (req.files && req.files.files) {
      const { files } = req.files;
      for (const file of files) {
        try {
          await FileService.create(file, documentCreated.id);
        } catch (err) {
          errorFiles.push({
            fileName: file.originalname,
            error: err.toString(),
          });
        }
      }
    }

    const requestResponse = {
      document: documentCreated,
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
  },

  update: async (req, res) => {
    const docWithModif = await TDocument.findOne({
      id: req.param('id'),
      modifiedDocJson: { '!=': null },
    });

    let rightAction;

    if (docWithModif) {
      rightAction = RightService.RightActions.EDIT_NOT_VALIDATED;
    } else {
      rightAction = RightService.RightActions.EDIT_ANY;
    }
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

    const resultConversion = await getConvertedDataFromClient(req);

    // Add new files
    const newFileArray = [];
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
          newFileArray.push(createdFile);
        } catch (err) {
          return res.serverError(err);
        }
      }
    }

    const jsonData = {
      ...resultConversion,
      id: req.param('id'),
      documentMainLanguage: req.body.documentMainLanguage.id,
      author: req.token.id,
      description: req.body.description,
      titleAndDescriptionLanguage: req.body.titleAndDescriptionLanguage.id,
      title: req.body.title,
      newFiles: ramda.isEmpty(newFileArray) ? undefined : newFileArray,
    };

    const updatedDocument = await TDocument.updateOne({
      id: req.param('id'),
    }).set({
      isValidated: false,
      dateValidation: null,
      modifiedDocJson: jsonData,
    });

    if (!updatedDocument) {
      return res.status(404);
    }

    const params = {};
    params.controllerMethod = 'DocumentController.update';
    return ControllerService.treat(req, null, updatedDocument, params, res);
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

            found.mainLanguage = await DocumentService.getMainLanguage(
              found.id,
            );
            await setNamesOfPopulatedDocument(found);
            found.children &&
              (await Promise.all(
                found.children.map(async (childDoc) => {
                  await DescriptionService.setDocumentDescriptions(childDoc);
                }),
              ));

            const params = {
              controllerMethod: 'DocumentController.findByCaverId',
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
          documentMainLanguage,
          author,
          authors,
          cave,
          descriptions,
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
          newFiles,
          modifiedFiles,
          deletedFiles,
          ...cleanedData
        } = modifiedDocJson;

        //We join the tables
        found = { ...cleanedData, id };
        found.author = author ? await TCaver.findOne(author) : null;
        found.cave = cave ? await TCave.findOne(cave) : null;
        found.entrance = entrance ? await TEntrance.findOne(entrance) : null;
        found.massif = massif ? await TMassif.findOne(massif) : null;
        found.editor = editor ? await TGrotto.findOne(editor) : null;
        found.identifierType = identifierType
          ? await TIdentifierType.findOne(identifierType)
          : null;
        found.library = library ? await TGrotto.findOne(library) : null;
        found.parent = parent ? await TDocument.findOne(parent) : null;
        found.reviewer = reviewer ? await TCaver.findOne(reviewer) : null;
        found.type = type ? await TType.findOne(type) : null;
        found.license = license ? await TLicense.findOne(license) : null;
        found.option = option ? await TOption.findOne(option) : null;
        found.authorizationDocument = authorizationDocument
          ? await TDocument.findOne(authorizationDocument)
          : null;

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

        let criteria = {
          document: id,
          isValidated: true,
        };
        // We don't want to retrieve files which are modified, new or deleted (because we already have them).
        // New are those which have isValidated = false
        let filesToIgnore = modifiedFiles || [];
        filesToIgnore =
          (deletedFiles && ramda.concat(filesToIgnore, deletedFiles)) ||
          filesToIgnore;

        const filesToIgnoreId = filesToIgnore.map((file) => file.id);
        if (!ramda.isEmpty(filesToIgnoreId)) {
          criteria = {
            document: id,
            id: { '!=': filesToIgnoreId },
            isValidated: true,
          };
        }

        const files = await TFile.find(criteria);

        found.files = files;
        found.newFiles = newFiles;
        found.deletedFiles = deletedFiles;
        found.modifiedFiles = modifiedFiles;

        //We can only modify the main language, so we don't have a "languages" attribute stored in the json. Uncomment if the possibility to add language is implemented.
        //found.languages = languages ? await Promise.all(languages.map(async (language) => { return await TLanguage.findOne(language)})) : [];

        found.mainLanguage = await TLanguage.findOne(documentMainLanguage);
        if (found.editor) {
          await NameService.setNames([found.editor], 'grotto');
        }

        //We handle the description because even if it has been modified, the entry in TDescription stayed intact.
        const descLang = await TLanguage.findOne(titleAndDescriptionLanguage);
        found.descriptions = [];
        found.descriptions.push({
          author: author,
          title: title,
          body: description,
          document: id,
          language: descLang,
        });
      } catch (err) {
        return res.serverError(err.toString());
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
    if (!documents) {
      return res.ok();
    }
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

    Promise.all(updatePromises).then(async (results) => {
      for (const doc of results) {
        if (doc.isValidated) {
          try {
            //If there is modified doc stored in the json column, we update the document with the data contained in it. Then we remove the json.
            if (doc.modifiedDocJson) {
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
                        language: documentMainLanguage,
                        isMain: true,
                      })
                      .usingConnection(db);
                  }

                  await TDescription.updateOne({ document: updatedDocument.id })
                    .set({
                      author: author,
                      body: description,
                      document: updatedDocument.id,
                      language: titleAndDescriptionLanguage,
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
                .intercept('E_UNIQUE', () => res.sendStatus(409))
                .intercept('UsageError', (e) => res.badRequest(e.cause.message))
                .intercept('AdapterError', (e) =>
                  res.badRequest(e.cause.message),
                )
                .intercept((e) => res.serverError(e.message));

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
              await updateDocumentInElasticSearchIndexes(found);
            } else {
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
              await addDocumentToElasticSearchIndexes(found);
            }
          } catch (err) {
            return res.serverError(
              'An error occured when trying to get all information about the document.',
            );
          }
        } else {
          /*
              If the document is not validated, check if there is a json document. If true we remove it, and we put isValidated to true (because the document kept the same values as when it was validated).
            */
          if (doc.modifiedDocJson) {
            await TDocument.updateOne(doc.id).set({
              isValidated: true,
              modifiedDocJson: null,
            });
          }
        }
      }
      return res.ok();
    });
  },

  checkRows: async (req, res) => {
    const doubleCheck = sails.helpers.csvhelpers.doubleCheck.with;
    const willBeCreated = [];
    const wontBeCreated = [];
    for (const [index, row] of req.body.data.entries()) {
      const idDb = doubleCheck({
        data: row,
        key: 'id',
        defaultValue: undefined,
      });
      const nameDb = doubleCheck({
        data: row,
        key: 'dct:rights/cc:attributionName',
        defaultValue: undefined,
      });
      if (!(idDb && nameDb)) {
        wontBeCreated.push({
          line: index + 2,
        });
      } else {
        const result = await TDocument.find({
          idDbImport: idDb,
          nameDbImport: nameDb,
          isDeleted: false,
        });
        if (result.length > 0) {
          wontBeCreated.push({
            line: index + 2,
          });
        } else {
          willBeCreated.push(row);
        }
      }
    }

    const requestResult = {
      willBeCreated,
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

    const requestResponse = {
      type: 'document',
      total: {
        success: 0,
        failure: 0,
      },
      successfulImport: [],
      failureImport: [],
    };

    for (const [index, data] of req.body.data.entries()) {
      const missingColumns = await sails.helpers.csvhelpers.checkColumns.with({
        data: data,
        additionalColumns: ['dct:creator'],
      });

      if (missingColumns.length > 0) {
        requestResponse.failureImport.push({
          line: index + 2,
          message: 'Columns missing : ' + missingColumns.toString(),
        });
      } else {
        try {
          const authorId = await sails.helpers.csvhelpers.getAuthor.with({
            data: data,
          });
          const dataDocument = await getConvertedDocumentFromCsv(
            data,
            authorId,
          );
          const dataLangDesc = getConvertedLangDescDocumentFromCsv(
            data,
            authorId,
          );
          const documentCreated = await DocumentService.createDocument(
            dataDocument,
            dataLangDesc,
            (err) => err,
          );

          requestResponse.successfulImport.push({
            documentId: documentCreated.id,
            title: dataLangDesc.title,
          });
        } catch (err) {
          sails.log.error(err);
          requestResponse.failureImport.push({
            line: index + 2,
            message: err.toString(),
          });
        }
      }
    }

    requestResponse.total.success = requestResponse.successfulImport.length;
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
