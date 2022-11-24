const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const GrottoService = require('../../../services/GrottoService');
const MappingService = require('../../../services/mapping/MappingService');
const NameService = require('../../../services/NameService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');

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
    return res.notFound({
      message: `Organization of id ${organizationId} not found.`,
    });
  }

  const cleanedData = {
    ...GrottoService.getConvertedDataFromClientRequest(req),
    id: organizationId,
  };

  try {
    const updatedOrganization = await TGrotto.updateOne({
      id: organizationId,
    }).set(cleanedData);

    await NameService.setNames([updatedOrganization], 'grotto');

    await NotificationService.notifySubscribers(
      req,
      updatedOrganization,
      req.token.id,
      NOTIFICATION_TYPES.UPDATE,
      NOTIFICATION_ENTITIES.ORGANIZATION
    );

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
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
