const ControllerService = require('../../../services/ControllerService');
const { toSimpleCave } = require('../../../services/mapping/converters');
const { toListFromController } = require('../../../services/mapping/utils');
const NameService = require('../../../services/NameService');

module.exports = async (req, res) => {
  const params = {
    controllerMethod: 'CaveController.findAll',
    searchedItem: 'all caves',
    notFoundMessage: 'No caves found.',
  };
  try {
    const found = await TCave.find({
      // TODO Add parameters ?
    })
      .populate('entrances')
      .populate('names')
      .sort('id ASC')
      .limit(10);

    await NameService.setNames(found, 'cave');

    return ControllerService.treatAndConvert(
      req,
      null,
      found,
      params,
      res,
      (data) => toListFromController('caves', data, toSimpleCave)
    );
  } catch (e) {
    return res.serverError(
      `An unexpected server error occured when trying to get ${params.searchedItem}`
    );
  }
};
