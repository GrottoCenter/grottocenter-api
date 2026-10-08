const ControllerService = require('../../../services/ControllerService');
const readBoolParam = require('../../../utils/readBoolParam');

module.exports = (req, res) => {
  const { value: isPrefered, error: isPreferedError } = readBoolParam(
    req,
    'isPrefered',
    true
  );
  if (isPreferedError) return res.badRequest(isPreferedError);

  return TLanguage.find()
    .where({ isPrefered })
    .exec((err, found) => {
      const params = {
        controllerMethod: 'LanguageController.findAll',
        searchedItem: `All Languages${isPrefered ? ' prefered' : ''}`,
      };
      const formattedFound = {
        languages: found,
      };
      return ControllerService.treat(req, err, formattedFound, params, res);
    });
};
