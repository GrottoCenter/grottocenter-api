const ControllerService = require('../../../services/ControllerService');

module.exports = (req, res) => {
  TDocument.count()
    .where({
      refBbs: { '!=': null },
    })
    .exec((err, found) => {
      const params = {};
      params.controllerMethod = 'DocumentController.countBBS';
      params.notFoundMessage = 'Problem while getting number of BBS documents.';

      const count = {};
      count.count = found;
      return ControllerService.treat(req, err, count, params, res);
    });
};
