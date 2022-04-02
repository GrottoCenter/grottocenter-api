const ControllerService = require('../../../services/ControllerService');

module.exports = (req, res) => {
  TLanguage.findOne(req.params.id).exec((err, found) => {
    const params = {};
    params.controllerMethod = 'LanguageController.find';
    params.searchedItem = `Language of id ${req.params.id}`;
    return ControllerService.treat(req, err, found, params, res);
  });
};
