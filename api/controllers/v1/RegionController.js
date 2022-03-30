/**
 */

const regionController = require('../RegionController');

module.exports = {
  find: (req, res) => regionController.find(req, res),
  findAll: (req, res) => regionController.findAll(req, res),
  search: (req, res) => regionController.search(req, res),
};
