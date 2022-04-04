const ControllerService = require('../../../services/ControllerService');
const EntranceService = require('../../../services/EntranceService');
const MappingV1Service = require('../../../services/MappingV1Service');

module.exports = async (req, res) => {
  if (
    !(await sails.helpers.checkIfExists.with({
      attributeName: 'id',
      attributeValue: req.param('id'),
      sailsModel: TEntranceDuplicate,
    }))
  ) {
    return res.badRequest(
      `Could not find duplicate with id ${req.param('id')}.`
    );
  }

  // Populate the entrance
  const duplicateFound = await TEntranceDuplicate.findOne(
    req.param('id')
  ).populate('author');

  duplicateFound.entrance = await TEntrance.findOne(duplicateFound.entrance)
    .populate('author')
    .populate('cave')
    .populate('names')
    .populate('descriptions')
    .populate('geology')
    .populate('locations')
    .populate('documents')
    .populate('riggings')
    .populate('comments');

  // Populate the duplicate
  const duplicateEntrance = duplicateFound.content.entrance;
  const { description, location, name } = duplicateFound.content.nameDescLoc;
  const popDuplicate = await EntranceService.populateJSON(duplicateEntrance);
  if (description) {
    description.author = await TCaver.findOne(description.author);
    popDuplicate.descriptions = [description];
  }
  if (location) {
    popDuplicate.locations = [location];
  }
  if (name) {
    name.name = name.text;
    popDuplicate.names = [name];
  }

  duplicateFound.content = popDuplicate;
  const params = {
    searchedItem: `Entrance Duplicate of id ${duplicateFound.id}`,
  };

  return ControllerService.treatAndConvert(
    req,
    null,
    duplicateFound,
    params,
    res,
    MappingV1Service.convertToEntranceDuplicateModel
  );
};
