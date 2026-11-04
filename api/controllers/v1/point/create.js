const ControllerService = require('../../../services/ControllerService');
const PointService = require('../../../services/PointService');
const { toPoint } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const { error, data } = await PointService.validatePointInput(
    PointService.readPointParams(req)
  );
  if (error) return res.badRequest(error);

  let createdPoint;
  try {
    createdPoint = await TPoint.create({
      ...data,
      author: req.token.id,
      dateInscription: new Date(),
    }).fetch();
  } catch (err) {
    sails.log.error('PointCreate: failed to create point', err);
    return res.serverError('An error occurred while creating the point.');
  }

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
