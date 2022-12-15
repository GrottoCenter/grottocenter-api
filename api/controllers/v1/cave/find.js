const CaveService = require('../../../services/CaveService');
const ControllerService = require('../../../services/ControllerService');
const DescriptionService = require('../../../services/DescriptionService');
const DocumentService = require('../../../services/DocumentService');
const NameService = require('../../../services/NameService');
const { toCave } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const params = {
    controllerMethod: 'CaveController.find',
    searchedItem: `Cave of id ${req.params.id}`,
    notFoundMessage: `Cave of id ${req.params.id} not found.`,
  };

  try {
    const cave = await TCave.findOne(req.params.id)
      .populate('descriptions')
      .populate('documents')
      .populate('entrances')
      .populate('author')
      .populate('reviewer')
      .populate('names');

    // TODO How to delete/restore entity ?
    if (!cave || cave.isDeleted)
      return res.notFound(`${params.searchedItem} not found`);

    [cave.massifs, cave.descriptions, ...cave.documents] = await Promise.all([
      CaveService.getMassifs(cave.id),
      DescriptionService.getCaveDescriptions(cave.id),
      ...cave.documents.map((d) => DocumentService.getDocument(d.id)),
    ]);

    const nameAsyncArr = [
      NameService.setNames(cave?.entrances, 'entrance'),
      NameService.setNames(cave?.massifs, 'massif'),
    ];
    if (cave.names.length === 0) {
      // As the name service will also get the entrance name if needed
      nameAsyncArr.push(NameService.setNames([cave], 'cave'));
    }
    await Promise.all(nameAsyncArr);

    // TODO What about other linked entities ?
    // - exploringGrottos
    // - partneringGrottos
    // - histories
    // - riggings
    // - comments

    return ControllerService.treatAndConvert(
      req,
      null,
      cave,
      params,
      res,
      toCave
    );
  } catch (e) {
    return res.serverError(
      `An unexpected server error occured when trying to get ${params.searchedItem}`
    );
  }
};
