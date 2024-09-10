const ControllerService = require('../../../services/ControllerService');
const CaveService = require('../../../services/CaveService');

module.exports = async (req, res) => {
  const cumulatedLength = await CaveService.getCumulatedLength();

  const value =
    cumulatedLength && cumulatedLength.sum_length
      ? Number.parseInt(cumulatedLength.sum_length, 10)
      : null;
  const nbData =
    cumulatedLength && cumulatedLength.nb_data
      ? Number.parseInt(cumulatedLength.nb_data, 10)
      : null;

  return ControllerService.treat(
    req,
    null,
    { sum_length: value, nb_data: nbData },
    { controllerMethod: 'CaveController.cumulatedLength' },
    res
  );
};
