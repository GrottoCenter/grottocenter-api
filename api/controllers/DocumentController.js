/**
 * DocumentController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const esClient = require('../../config/elasticsearch').elasticsearchCli;
const ramda = require('ramda');

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
  return document;
};

// Extract everything from the request body except id and dateInscription
const getConvertedDataFromClient = (req) => {
  const { id, ...reqBodyWithoutId } = req.body; // remove id if present to avoid null id (and an error)
  return {
    ...reqBodyWithoutId,
    author: req.token.id,
    authors: req.body.authors ? req.body.authors.map((a) => a.id) : undefined,
    datePublication:
      req.body.publicationDate === '' ? null : req.body.publicationDate,
    editor: ramda.pathOr(undefined, ['editor', 'id'], req.body),
    identifierType: ramda.pathOr(undefined, ['identifierType', 'id'], req.body),
    library: ramda.pathOr(undefined, ['library', 'id'], req.body),
    license: 1,
    massif: ramda.pathOr(undefined, ['massif', 'id'], req.body),
    parent: ramda.pathOr(undefined, ['partOf', 'id'], req.body),
    regions: req.body.regions ? req.body.regions.map((r) => r.id) : undefined,
    subjects: req.body.subjects
      ? req.body.subjects.map((s) => s.code)
      : undefined,
    type: ramda.pathOr(undefined, ['documentType', 'id'], req.body),
  };
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
const addDocumentToElasticSearchIndexes = (document) => {
  // const { type, ...documentWithoutType } = document; // "type" property is already used by ES, don't spread it.
  const esBody = getEsBody(document);
  // Create in documents-index
  esClient.create(
    {
      index: 'documents-index',
      type: 'data',
      id: document.id,
      body: {
        ...esBody,
        type: 'document',
      },
    },
    (error) => {
      if (error) {
        sails.log.error(error);
      }
    },
  );

  // Create in document-collections-index or document-issues-index
  const additionalIndex =
    document.type.name === 'Issue'
      ? 'document-issues-index'
      : document.type.name === 'Collection'
      ? 'document-collections-index'
      : '';
  if (additionalIndex !== '') {
    esClient.create(
      {
        index: additionalIndex,
        type: 'data',
        id: document.id,
        body: {
          ...esBody,
          type: `document-${document.type.name.toLowerCase()}`,
        },
      },
      (error) => {
        if (error) {
          sails.log.error(error);
        }
      },
    );
  }
};

//TO DO: proper update
const updateDocumentInElasticSearchIndexes = (document) => {
  ElasticsearchService.deleteResource('documents', document.id);
  addDocumentToElasticSearchIndexes(document);
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
        rightAction: RightService.RightActions.EDIT_ANY,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to create a document.',
        );
      });
    if (!hasRight) {
      return res.forbidden('You are not authorized to create a document.');
    }

    const cleanedData = {
      ...getConvertedDataFromClient(req),
      dateInscription: new Date(),
    };

    // Launch creation request using transaction: it performs a rollback if an error occurs
    await sails
      .getDatastore()
      .transaction(async (db) => {
        const documentCreated = await TDocument.create(cleanedData)
          .fetch()
          .usingConnection(db);

        // Create associated data not handled by TDocument manually
        if (ramda.pathOr(null, ['documentMainLanguage', 'id'], req.body)) {
          await JDocumentLanguage.create({
            document: documentCreated.id,
            language: req.body.documentMainLanguage.id,
            isMain: true,
          }).usingConnection(db);
        }

        await TDescription.create({
          author: req.token.id,
          body: req.body.description,
          dateInscription: new Date(),
          document: documentCreated.id,
          language: req.body.titleAndDescriptionLanguage.id,
          title: req.body.title,
        }).usingConnection(db);

        const params = {};
        params.controllerMethod = 'DocumentController.create';
        return ControllerService.treat(req, null, documentCreated, params, res);
      })
      .intercept('E_UNIQUE', (e) => {
        sails.log.error(e.message);
        return res.status(409).send(e.message);
      })
      .intercept({ name: 'UsageError' }, (e) => {
        sails.log.error(e.message);
        return res.badRequest(e.message);
      })
      .intercept({ name: 'AdapterError' }, (e) => {
        sails.log.error(e.message);
        return res.badRequest(e.message);
      })
      .intercept((e) => {
        sails.log.error(e.message);
        return res.serverError(e.message);
      });
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

    const jsonData = {
      ...getConvertedDataFromClient(req),
      id: req.param('id'),
      documentMainLanguage: req.body.documentMainLanguage.id,
      author: req.token.id,
      description: req.body.description,
      titleAndDescriptionLanguage: req.body.titleAndDescriptionLanguage.id,
      title: req.body.title,
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
    !isValidated ? whereClause.and.push({ dateValidation: null }) : '';

    TDocument.find()
      .where(whereClause)
      .skip(req.param('skip', 0))
      .limit(req.param('limit', 50))
      .sort(sort)
      .populate('author')
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

            if (!found) {
              res.status(404);
              return res.json({
                error: `There is no document matching your criterias. It can be because sorting by ${sort} is not supported.`,
              });
            }

            await Promise.all(
              await found.map(async (doc) => {
                await NameService.setNames(
                  [
                    ...(doc.library ? [doc.library] : []),
                    ...(doc.editor ? [doc.editor] : []),
                  ],
                  'grotto',
                );
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

            if (!found) {
              res.status(404);
              return res.json({
                error: `There is no document matching your criterias. It can be because sorting by ${sort} is not supported.`,
              });
            }

            await Promise.all(
              await found.map(async (doc) => {
                await NameService.setNames(
                  [
                    ...(doc.library ? [doc.library] : []),
                    ...(doc.editor ? [doc.editor] : []),
                  ],
                  'grotto',
                );
              }),
            );

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
          files,
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
        found.files = files
          ? await Promise.all(
              files.map(async (file) => {
                return await TFile.findOne(file);
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
        .populate('authors')
        .populate('cave')
        .populate('descriptions')
        .populate('editor')
        .populate('entrance')
        .populate('files')
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
      found.mainLanguage = await DocumentService.getMainLanguage(found.id);
      await setNamesOfPopulatedDocument(found);
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
                })
                .intercept('E_UNIQUE', () => res.sendStatus(409))
                .intercept('UsageError', (e) => res.badRequest(e.cause.message))
                .intercept('AdapterError', (e) =>
                  res.badRequest(e.cause.message),
                )
                .intercept((e) => res.serverError(e.message));

              const found = await TDocument.findOne(doc.id)
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
              await setNamesOfPopulatedDocument(found);
              await updateDocumentInElasticSearchIndexes(found);
            } else {
              const found = await TDocument.findOne(doc.id)
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
};
