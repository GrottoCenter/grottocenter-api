const ControllerService = require('../../../services/ControllerService');

module.exports = (req, res) => {
  TIdentifierType.find().exec((err, found) => {
    const params = {
      controllerMethod: 'TIdentifierType.findAll',
      searchedItem: 'All document identifier types',
    };
    return ControllerService.treat(
      req,
      err,
      {
        identifierTypes: found.map((idType) => ({
          ...idType,
          id: idType.id.trim(), // remove trailling space
        })),
      },
      params,
      res
    );
  });
};
