const ControllerService = require('../../../services/ControllerService');
const GrottoService = require('../../../services/GrottoService');
const { toOrganization } = require('../../../services/mapping/converters');
const { validateNameLength } = require('../../../utils/nameValidation');
const {
  validatePostalCodeLength,
} = require('../../../utils/postalCodeValidation');

module.exports = async (req, res) => {
  // Check params
  if (!req.param('name')) {
    return res.badRequest(
      'You must provide a name to create a new organization.'
    );
  }

  // Validate name length
  const nameError = validateNameLength(req.body.name?.text);
  if (nameError) {
    return res.badRequest(nameError);
  }

  const cleanedData = {
    ...GrottoService.getConvertedDataFromClientRequest(req),
    author: req.token.id,
    dateInscription: new Date(),
  };

  // Validate postalCode length (checked on the trimmed value)
  const postalCodeError = validatePostalCodeLength(cleanedData.postalCode);
  if (postalCodeError) {
    return res.badRequest(postalCodeError);
  }

  const nameData = {
    author: req.token.id,
    language: req.param('name').language,
    text: req.param('name').text,
  };

  const newOrganizationPopulated = await GrottoService.createGrotto(
    req,
    cleanedData,
    nameData
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    newOrganizationPopulated,
    { controllerMethod: 'GrottoController.create' },
    res,
    toOrganization
  );
};
