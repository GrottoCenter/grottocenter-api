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
      editor: ramda.pathOr(undefined, ['editor', 'id'], req.body),
      identifierType: ramda.pathOr(
        undefined,
        ['identifierType', 'code'],
        req.body,
      ),
      library: ramda.pathOr(undefined, ['library', 'id'], req.body),
      license: 1,
      massif: ramda.pathOr(undefined, ['massif', 'id'], req.body),
      regions: req.body.regions ? req.body.regions.map((r) => r.id) : undefined,
      subjects: req.body.subjects
        ? req.body.subjects.map((s) => s.code)
        : undefined,
      type: ramda.pathOr(undefined, ['documentType', 'id'], req.body),
    };

    // Launch creation request
    TDocument.create(cleanedData)
      .then(() => {
        const params = {};
        params.controllerMethod = 'DocumentController.create';
        return ControllerService.treat(req, null, {}, params, res);
      })
      .catch({ code: 'E_UNIQUE' }, (err) => {
        return res.sendStatus(409);
      })
      .catch({ name: 'UsageError' }, (err) => {
        return res.badRequest(err.cause.message);
      })
      .catch({ name: 'AdapterError' }, (err) => {
        return res.badRequest(err.cause.message);
      })
      .catch((err) => {
        return res.serverError(err.cause.message);
      });
  },

  findAll: (
    req,
    res,
    next,
    converter = MappingV1Service.convertToDocumentList,
  ) => {
    const sort = `${req.param('sortBy', 'dateInscription')} ${req.param(
      'orderBy',
      'ASC',
    )}`;
    TDocument.find()
      .where({ isValidated: req.param('isValidated') === 'true' })
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
          .where({ isValidated: req.param('isValidated') === 'true' })
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
