/**
 */

const nameController = require('../NameController');

module.exports = {
  update: (req, res) =>
    nameController.update(req, res, MappingV1Service.convertToNameModel),
  setAsMain: (req, res) =>
    nameController.setAsMain(req, res, MappingV1Service.convertToNameModel),
};
