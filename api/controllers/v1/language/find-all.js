const ControllerService = require('../../../services/ControllerService');

module.exports = (req, res) => {
  TLanguage.find()
    .where({ isPrefered: req.param('isPrefered', true) })
    .exec((err, found) => {
      const params = {
        controllerMethod: 'LanguageController.findAll',
        searchedItem: `All Languages${
          req.param('isPrefered') ? ' prefered' : ''
        }`,
      };
      const formattedFound = {
        languages: found,
      };
      return ControllerService.treat(req, err, formattedFound, params, res);
    });
};
