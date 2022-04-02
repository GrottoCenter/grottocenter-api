/**
 */

const identifierTypeController = require('../IdentifierTypeController');

module.exports = {
  findAll: (req, res) => identifierTypeController.findAll(req, res),
};
