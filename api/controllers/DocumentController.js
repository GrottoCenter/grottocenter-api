/**
 * DocumentController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

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
        isBBS: true,
      })
      .exec((err, found) => {
        const params = {};
        params.controllerMethod = 'DocumentController.count';
        params.notFoundMessage = 'Problem while getting number of documents.';

        const count = {};
        count.count = found;
        return ControllerService.treat(req, err, count, params, res);
      });
  },

  create: (req, res) => {
    // TODO later
    const err = null;
    const found = {};
    const params = {};
    return ControllerService.treat(req, err, count, params, res);
  },
};
