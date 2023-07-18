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

  const cleanedData = {
    name: req.param('name'),
  };

  try {
    await TName.updateOne({
      id: nameId,
    }).set(cleanedData);
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
    params.controllerMethod = 'NameController.update';
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
