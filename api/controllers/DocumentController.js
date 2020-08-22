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
      editor: ramda.pathOr(undefined, ['editor', 'id'], req.body),
      library: ramda.pathOr(undefined, ['library', 'id'], req.body),
      identifierType: ramda.pathOr(
        undefined,
        ['identifierType', 'code'],
        req.body,
      ),
      authors: req.body.authors ? req.body.authors.map((a) => a.id) : undefined,
      license: 1,
      dateInscription: new Date(),
      author: req.token.id,
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

  validate: (req, res, next) => {
    const isValidated = req.param('isValidated').toLowerCase() === 'true';
    const validationComment = req.param('validationComment', null);
    const id = req.param('id');

    if (isValidated === false && !validationComment) {
      return res.badRequest(
        'If the document is refused, a comment must be provided.',
      );
    }

    TDocument.updateOne({ id: id })
      .set({
        isValidated: isValidated,
        validationComment: validationComment,
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
};
