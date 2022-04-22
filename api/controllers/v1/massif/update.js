const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingV1Service = require('../../../services/MappingService');
const RightService = require('../../../services/RightService');

// eslint-disable-next-line consistent-return
module.exports = async (req, res) => {
  // Check right
  const massifId = req.param('id');

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
  // eslint-disable-next-line consistent-return
  keys.forEach((prop) => {
    if (!propretiesUpdatable.includes(prop)) {
      return res.badRequest(
        `Could not update property ${prop}, it is not a property which is updatable.`
      );
    }
  });

  // Launch update request using transaction: it performs a rollback if an error occurs
  try {
    await sails.getDatastore().transaction(async (db) => {
      // conversion of geoJson into PostGis Geom
      if (req.body.geogPolygon) {
        const resQuery = await sails
          .getDatastore()
          .sendNativeQuery(
            `SELECT ST_AsText('${JSON.stringify(req.body.geogPolygon)}')`,
            []
          );
        req.body.geogPolygon = resQuery.rows[0].st_astext;
      }
      const updatedMassif = await TMassif.updateOne(massifId)
        .set(req.body)
        .usingConnection(db);

      const params = {};
      params.controllerMethod = 'MassifController.update';
      return ControllerService.treatAndConvert(
        req,
        null,
        updatedMassif,
        params,
        res,
        MappingV1Service.convertToMassifModel
      );
    });
  } catch (e) {
    ErrorService.getDefaultErrorHandler(res)(e);
    return false;
  }
};
