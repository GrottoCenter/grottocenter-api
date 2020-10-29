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
  return document;
};

/**
 * Based on the logstash.conf file.
 * The document must be fully populated and with all its names set (@see setNamesOfPopulatedDocument).
 */
const addDocumentToElasticSearchIndexes = (document) => {
  const esBody = {
    ...document,
    authors: document.authors
      ? document.authors.map((a) => a.nickname).join(', ')
      : null,
    date_part: document.datePublication // eslint-disable-line camelcase
      ? new Date(document.datePublication).getYear()
      : null,
    description: document.descriptions[0].body,
    'editor id': ramda.propOr(null, ['editor', 'id'], document),
    'editor name': ramda.propOr(null, ['editor', 'name'], document),
    'library id': ramda.propOr(null, ['library', 'id'], document),
    'library name': ramda.propOr(null, ['library', 'name'], document),
    regions: document.regions
      ? document.regions.map((r) => r.name).join(', ')
      : null,
    subjects: document.subjects
      ? document.subjects.map((s) => s.subject).join(', ')
      : null,
    title: document.descriptions[0].title,
    'type id': ramda.propOr(null, ['type', 'id'], document),
    'type name': ramda.propOr(null, ['type', 'name'], document),
  };

  // Update ES documents-index
  try {
    esClient.create({
      index: `documents-index`,
      type: 'data',
      id: document.id,
      body: {
        esBody,
      },
    });
  } catch (error) {
    sails.log.error(error);
  }

  // Update ES document-collections-index or document-issues-index
  const esIndexToUpdate =
    document.type.name === 'Issue'
      ? 'document-issues-index'
      : document.type.name === 'Collection'
      ? 'document-collections-index'
      : '';
  if (esIndexToUpdate !== '') {
    try {
      esClient.update({
        index: esIndexToUpdate,
        type: 'data',
        id: document.id,
        body: {
          esBody,
        },
      });
    } catch (error) {
      sails.log.error(error);
    }
  }
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
        rightEntity: RightService.RightEntities.BIBLIOGRAPHY,
        rightAction: RightService.RightActions.EDIT_ALL,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to create a document.',
        );
      });
    if (!hasRight) {
      return res.forbidden('You are not authorized to create a document.');
    }

    // Clean the data
    const cleanedData = {
      ...req.body,
      author: req.token.id,
      authors: req.body.authors ? req.body.authors.map((a) => a.id) : undefined,
      dateInscription: new Date(),
      datePublication: req.body.publicationDate,
      editor: ramda.pathOr(undefined, ['editor', 'id'], req.body),
      identifierType: ramda.pathOr(
        undefined,
        ['identifierType', 'code'],
        req.body,
      ),
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

    // Launch creation request using transaction: it performs a rollback if an error occurs
    await sails
      .getDatastore()
      .transaction(async (db) => {
        const documentCreated = await TDocument.create(cleanedData)
          .fetch()
          .usingConnection(db);

        // Create associated data not handled by TDocument manually
        await JDocumentLanguage.create({
          document: documentCreated.id,
          language: req.body.documentMainLanguage.id,
          isMain: true,
        }).usingConnection(db);

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
      .intercept('E_UNIQUE', () => res.sendStatus(409))
      .intercept('UsageError', (e) => res.badRequest(e.cause.message))
      .intercept('AdapterError', (e) => res.badRequest(e.cause.message))
      .intercept((e) => res.serverError(e.message));
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
      If the document is not validated and has a dateValidatoin, it means that it has been refused.
      We don't want to retrieve these documents refused. 
      So when isValidated is false, we need to retrieve only the document with a dateValidatoin set to null 
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

  find: async (
    req,
    res,
    next,
    converter = MappingV1Service.convertToDocumentModel,
  ) => {
    TDocument.findOne()
      .where({ id: req.param('id') })
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
      .populate('type')
      .exec(async (err, found) => {
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

        await setNamesOfPopulatedDocument(found);
        found.mainLanguage = await DocumentService.getMainLanguage(found.id);

        return ControllerService.treatAndConvert(
          req,
          err,
          found,
          params,
          res,
          converter,
        );
      });
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
        isValidated: isValidated,
        validationComment: validationComment,
        dateValidation: new Date(),
      })
      .then(async (updatedDocument) => {
        if (isValidated) {
          const populatedDoc = await Tdocument.findOne({
            id: updatedDocument.id,
          })
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

  multipleValidate: (req, res, next) => {
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
          isValidated: isValidated,
          validationComment: validationComment,
          dateValidation: new Date(),
        }),
      );
      Promise.all(updatePromises).then((results) => {
        results.map((doc) => {
          if (doc.isValidated) {
            TDocument.findOne({ id: doc.id })
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
              .populate('type')
              .exec(async (err, found) => {
                if (err) {
                  return res.serverError(
                    'An error occured when trying to get all information about the document.',
                  );
                }
                await setNamesOfPopulatedDocument(found);
                await addDocumentToElasticSearchIndexes(found);
              });
          }
        });
        res.ok();
      });
    });
  },
};
