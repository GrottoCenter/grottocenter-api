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

  create: (req, res) => {
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
    };

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
};
