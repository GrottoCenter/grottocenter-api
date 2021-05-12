/**
 */

const nameController = require('../NameController');

module.exports = {
  update: (req, res) =>
    nameController.update(req, res, MappingV1Service.convertToNameModel),
  updateIsMain: (req, res) =>
    nameController.updateIsMain(req, res, MappingV1Service.convertToNameModel),
};
