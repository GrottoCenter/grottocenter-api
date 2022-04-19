const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const GrottoService = require('../../../services/GrottoService');
const MappingService = require('../../../services/MappingService');
const NameService = require('../../../services/NameService');
const RightService = require('../../../services/RightService');

// eslint-disable-next-line consistent-return
module.exports = async (req, res) => {
  // Check right
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.ORGANIZATION,
      rightAction: RightService.RightActions.EDIT_ANY,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to update an organization.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to update an organization.');
  }

  // Check if organization exists
  const organizationId = req.param('id');
  const currentOrganization = await TGrotto.findOne(organizationId);
  if (!currentOrganization) {
    return res.status(404).send({
      message: `Organization of id ${organizationId} not found.`,
    });
  }

  const cleanedData = {
    ...GrottoService.getConvertedDataFromClientRequest(req),
    id: organizationId,
  };

  // Launch update request using transaction: it performs a rollback if an error occurs
  try {
    await sails.getDatastore().transaction(async (db) => {
      const updatedOrganization = await TGrotto.updateOne({
        id: organizationId,
      })
        .set(cleanedData)
        .usingConnection(db);

      await NameService.setNames([updatedOrganization], 'grotto');

      const params = {};
      params.controllerMethod = 'OrganizationController.update';
      return ControllerService.treatAndConvert(
        req,
        null,
        updatedOrganization,
        params,
        res,
        MappingService.convertToOrganizationModel
      );
    });
  } catch (e) {
    ErrorService.getDefaultErrorHandler(res)(e);
  }
};
