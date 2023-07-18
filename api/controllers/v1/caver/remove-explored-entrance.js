const ErrorService = require('../../../services/ErrorService');

module.exports = async (req, res) => {
  // Check params
  const caverId = req.param('caverId');
  const entranceId = req.param('entranceId');
  if (
    !(await sails.helpers.checkIfExists.with({
      attributeName: 'id',
      attributeValue: caverId,
      sailsModel: TCaver,
    }))
  ) {
    return res.badRequest(`Could not find caver with id ${caverId}.`);
  }
  if (
    !(await sails.helpers.checkIfExists.with({
      attributeName: 'id',
      attributeValue: entranceId,
      sailsModel: TEntrance,
    }))
  ) {
    return res.badRequest(`Could not find entrance with id ${entranceId}.`);
  }
  if (Number(caverId) !== req.token.id) {
    return res.forbidden(
      'You can not unmark an entrance as explored to another account than yours.'
    );
  }

  // Update caver
  try {
    await TCaver.removeFromCollection(caverId, 'exploredEntrances', entranceId);
    return res.ok();
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
