/**
 * LanguageController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  find: (req, res, next) => {
    TLanguage.findOne(req.params.id).exec((err, found) => {
      const params = {};
      params.controllerMethod = 'LanguageController.find';
      params.searchedItem = `Language of id ${req.params.id}`;
      return ControllerService.treat(req, err, found, params, res);
    });
  },

  findAll: (req, res, next) => {
    TLanguage.find()
      .where({ isPrefered: req.param('isPrefered', true) })
      .exec((err, found) => {
        const params = {
          controllerMethod: 'LanguageController.findAll',
          searchedItem:
            'All Languages' + (req.param('isPrefered') ? ' prefered' : ''),
        };
        const formattedFound = {
          languages: found,
        };
        return ControllerService.treat(req, err, formattedFound, params, res);
      });
  },
};
