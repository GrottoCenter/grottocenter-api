/**
 */

const regionController = require('../RegionController');

module.exports = {
  find: (req, res, next) => regionController.find(req, res, next),
  findAll: (req, res, next) => regionController.findAll(req, res, next),
  search: (req, res, next) => regionController.search(req, res, next),
};
