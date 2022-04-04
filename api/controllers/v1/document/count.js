const ControllerService = require('../../../services/ControllerService');

module.exports = (req, res) => {
  TDocument.count().exec((err, found) => {
    const params = {};
    params.controllerMethod = 'DocumentController.count';
    params.notFoundMessage = 'Problem while getting number of documents.';

    const count = {};
    count.count = found;
    return ControllerService.treat(req, err, count, params, res);
  });
};
