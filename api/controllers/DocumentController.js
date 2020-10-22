/**
 * DocumentController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const ramda = require('ramda');

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

  findAll: (
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
          .exec((err, countFound) => {
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

  find: (
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
      .exec((err, found) => {
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

        const promises = [];
        // Get name of cave, entrance and massif
        promises.push(
          ramda.isNil(found.entrance)
            ? ''
            : NameService.setNames([found.entrance], 'entrance'),
        );
        promises.push(
          ramda.isNil(found.cave)
            ? ''
            : NameService.setNames([found.cave], 'cave'),
        );
        promises.push(
          ramda.isNil(found.massif)
            ? ''
            : NameService.setNames([found.massif], 'massif'),
        );

        // Get main language
        promises.push(DocumentService.getMainLanguage(found.id));

        Promise.all(promises).then((results) => {
          // Names
          results[0] !== '' ? (found.entrance = results[0][0]) : '';
          results[1] !== '' ? (found.cave = results[1][0]) : '';
          results[2] !== '' ? (found.massif = results[2][0]) : '';
          // Main language
          found.mainLanguage = results[3];
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
      .then((updatedDocument) => {
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
        res.ok();
      });
    });
  },
};
