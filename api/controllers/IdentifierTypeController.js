/**
 * IdentifierTypeController
 *
 * @description :: Server-side logic for managing document identifier types
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
  findAll: (req, res, next) => {
    TIdentifierType.find().exec((err, found) => {
      const params = {
        controllerMethod: 'TIdentifierType.findAll',
        searchedItem: 'All document identifier types',
      };
      const formattedFound = {
        identifierTypes: found,
      };
      return ControllerService.treat(req, err, formattedFound, params, res);
    });
  },
};
