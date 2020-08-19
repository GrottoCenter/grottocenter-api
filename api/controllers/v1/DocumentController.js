/**
 */

const documentController = require('../DocumentController');

module.exports = {
  count: (req, res, next) => documentController.count(req, res, next),
};
