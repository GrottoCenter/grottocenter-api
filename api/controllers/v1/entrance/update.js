const ControllerService = require('../../../services/ControllerService');
const EntranceService = require('../../../services/EntranceService');
const ErrorService = require('../../../services/ErrorService');
const MappingService = require('../../../services/MappingService');
const NameService = require('../../../services/NameService');
const RightService = require('../../../services/RightService');

const checkRight = sails.helpers.checkRight.with;

module.exports = async (req, res) => {
  // Check right
  const hasRight = await checkRight({
    groups: req.token.groups,
    rightEntity: RightService.RightEntities.ENTRANCE,
    rightAction: RightService.RightActions.EDIT_ANY,
  }).intercept('rightNotFound', () =>
    res.serverError(
      'A server error occured when checking your right to update an entrance.'
    )
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to update an entrance.');
  }

  // Check if entrance exists
  const entranceId = req.param('id');
  const currentEntrance = await TEntrance.findOne(entranceId);
  if (!currentEntrance) {
    return res.notFound({
      message: `Entrance of id ${entranceId} not found.`,
    });
  }

  const cleanedData = {
    ...EntranceService.getConvertedDataFromClientRequest(req),
    id: entranceId,
  };

  // Check if sensitive change is permitted
  const { isSensitive: newIsSensitiveValue } = cleanedData;

  if (newIsSensitiveValue !== undefined) {
    const hasSensitiveRight = await checkRight({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.ENTRANCE,
      rightAction: newIsSensitiveValue
        ? RightService.RightActions.MARK_AS_SENSITIVE
        : RightService.RightActions.UNMARK_AS_SENSITIVE,
    }).intercept('rightNotFound', () =>
      res.serverError(
        `A server error occured when checking your right to ${
          newIsSensitiveValue ? 'un' : ''
        }mark an entrance as sensitive.`
      )
    );
    if (!hasSensitiveRight) {
      return res.forbidden(
        `You are not authorized to ${
          newIsSensitiveValue ? 'un' : ''
        }mark an entrance as sensitive.`
      );
    }
  }

  try {
    const updatedEntrance = await TEntrance.updateOne({
      id: entranceId,
    }).set(cleanedData);

    // Handle name manually
    // Currently, use only one name per entrance (even if the model can handle multiple names)
    await TName.updateOne({
      entrance: entranceId,
    }).set({
      name: req.param('name')?.text,
      language: req.param('name')?.language,
    });

    // Populate and return
    await NameService.setNames([updatedEntrance], 'entrance');
    const params = {
      controllerMethod: 'EntranceController.update',
    };
    return ControllerService.treatAndConvert(
      req,
      null,
      updatedEntrance,
      params,
      res,
      MappingService.convertToEntranceModel
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
