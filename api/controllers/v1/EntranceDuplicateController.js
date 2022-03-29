/**
 */

const entranceDuplicateController = require('../EntranceDuplicateController');

module.exports = {
  createMany: (req, res) => entranceDuplicateController.createMany(req, res),
  createFromDuplicate: (req, res) =>
    entranceDuplicateController.createFromDuplicate(req, res),
  delete: (req, res) => entranceDuplicateController.delete(req, res),
  deleteMany: (req, res) => entranceDuplicateController.deleteMany(req, res),
  find: (req, res) => entranceDuplicateController.find(req, res),
  findAll: (req, res) => entranceDuplicateController.findAll(req, res),
};
