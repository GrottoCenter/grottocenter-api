/**
 */

const documentTypeController = require('../DocumentTypeController');

module.exports = {
  find: (req, res) => documentTypeController.find(req, res),
  findAll: (req, res) => documentTypeController.findAll(req, res),
};
