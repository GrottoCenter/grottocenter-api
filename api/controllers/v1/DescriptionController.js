/**
 * DescriptionController
 *
 * @description :: Server-side logic for managing caves
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

const MappingV1Service = require('../../services/MappingV1Service');
const descriptionController = require('../DescriptionController');

module.exports = {
  update: (req, res) =>
    descriptionController.update(
      req,
      res,
      MappingV1Service.convertToDescriptionModel
    ),
  create: (req, res) =>
    descriptionController.create(
      req,
      res,
      MappingV1Service.convertToDescriptionModel
    ),
};
