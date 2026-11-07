const ControllerService = require('../../../services/ControllerService');
const PointService = require('../../../services/PointService');
const { toPoint } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  let result;
  try {
    result = await PointService.createPoint(
      PointService.readPointParams(req),
      req.token.id
    );
  } catch (err) {
    sails.log.error('PointCreate: failed to create point', err);
    return res.serverError('An error occurred while creating the point.');
  }
  if (result.error) return res.badRequest(result.error);
  const createdPoint = result.point;

  const populatedPoint = await ControllerService.populateCreated(
    createdPoint,
    PointService.getPopulatedPoint,
    'PointController.create'
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    populatedPoint,
    { controllerMethod: 'PointController.create' },
    res,
    toPoint
  );
};
