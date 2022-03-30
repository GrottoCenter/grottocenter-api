/**
 * DocumentTypeController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const ControllerService = require('../services/ControllerService');

module.exports = {
  find: (req, res) => {
    TType.findOne(req.params.id).exec((err, found) => {
      const params = {};
      params.controllerMethod = 'DocumentTypeController.find';
      params.searchedItem = `Document type of id ${req.params.id}`;
      return ControllerService.treat(req, err, found, params, res);
    });
  },

  findAll: (req, res) => {
    TType.find({
      ...(req.param('isAvailable', undefined) !== undefined && {
        isAvailable: req.param('isAvailable'),
      }),
    }).exec((err, found) => {
      const params = {
        controllerMethod: 'DocumentTypeController.findAll',
        searchedItem: 'All document types',
      };
      const formattedFound = {
        documentTypes: found,
      };
      return ControllerService.treat(req, err, formattedFound, params, res);
    });
  },
};
