const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const { toName } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  // Check if name exists
  const nameId = req.param('id');
  const currentName = await TName.findOne(nameId);
  if (!currentName) {
    return res.notFound({
      message: `Name of id ${nameId} not found.`,
    });
  }

  // Do nothing if already main
  if (currentName.isMain) {
    const params = {};
    params.controllerMethod = 'NameController.setAsMain';
    return ControllerService.treatAndConvert(
      req,
      null,
      currentName,
      params,
      res,
      toName
    );
  }

  try {
    const updatedName = await TName.updateOne({
      id: nameId,
    }).set({ isMain: true });

    // Update other names of the entity to isMain = false
    const possibleEntites = [
      { id: updatedName.cave, type: 'cave' },
      { id: updatedName.entrance, type: 'entrance' },
      { id: updatedName.grotto, type: 'grotto' },
      { id: updatedName.massif, type: 'massif' },
      { id: updatedName.point, type: 'point' },
    ];
    const entity = possibleEntites.find((e) => e.id !== null);
    if (entity) {
      await TName.update({
        [entity.type]: entity.id,
        id: { '!=': updatedName.id },
      }).set({ isMain: false });
    }

    // Return name updated and populated
    const newName = await TName.findOne(nameId)
      .populate('author')
      .populate('cave')
      .populate('entrance')
      .populate('grotto')
      .populate('language')
      .populate('massif')
      .populate('point')
      .populate('reviewer');

    const params = {};
    params.controllerMethod = 'NameController.setAsMain';
    return ControllerService.treatAndConvert(
      req,
      null,
      newName,
      params,
      res,
      toName
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
