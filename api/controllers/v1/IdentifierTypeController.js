/**
 */

const identifierTypeController = require('../IdentifierTypeController');

module.exports = {
  findAll: (req, res, next) => identifierTypeController.findAll(req, res, next),
};
