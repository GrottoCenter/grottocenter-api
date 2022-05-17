const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingService = require('../../../services/MappingService');
const RightService = require('../../../services/RightService');
const MassifService = require('../../../services/MassifService');

module.exports = async (req, res) => {
  // Check right

  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.MASSIF,
      rightAction: RightService.RightActions.EDIT_ANY,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to update a caver.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to update a massif.');
  }

  // Check if massif exists
  const massifId = req.param('id');
  if (
    !(await sails.helpers.checkIfExists.with({
      attributeName: 'id',
      attributeValue: massifId,
      sailsModel: TMassif,
    }))
  ) {
    res.status(404);
    return res.json({ error: `Could not find massif with id ${massifId}.` });
  }

  // list of propreties to update
  const propretiesUpdatable = [
    'caves',
    'descriptions',
    'documents',
    'geogPolygon',
    'names',
  ];
  // Check if the changes requested are authorized (check propretiesUpdatable)
  const keys = Object.keys(req.body);

  let c = 0;
  const propretiesUnudapable = [];
  while (c < keys.length) {
    if (!propretiesUpdatable.includes(keys[c])) {
      propretiesUnudapable.push(keys[c]);
    }
    c += 1;
  }
  if (propretiesUnudapable.length > 0) {
    if (propretiesUnudapable.length === 1) {
      return res.badRequest(
        `Could not update property ${propretiesUnudapable[0]}, is not a property which is updatable.`
      );
    }
    return res.badRequest(
      `Could not update properties ${propretiesUnudapable}, they are not updatable propeties .`
    );
  }

  try {
    // conversion of geoJson into PostGis Geom
    if (req.body.geogPolygon) {
      req.body.geogPolygon = await MassifService.geoJsonToWKT(
        req.body.geogPolygon
      );
    }
    const updatedMassif = await TMassif.updateOne(massifId).set(req.body);

    const params = {};
    params.controllerMethod = 'MassifController.update';
    return ControllerService.treatAndConvert(
      req,
      null,
      updatedMassif,
      params,
      res,
      MappingService.convertToMassifModel
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
