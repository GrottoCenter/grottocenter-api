const ControllerService = require('../../../services/ControllerService');
const EntranceService = require('../../../services/EntranceService');
const { toEntranceDuplicate } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const id = req.param('id');

  const duplicateFound =
    await TEntranceDuplicate.findOne(id).populate('author');
  if (!duplicateFound) {
    return res.badRequest(`Could not find duplicate with id ${id}.`);
  }

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

  return ControllerService.treatAndConvert(
    req,
    null,
    duplicateFound,
    { searchedItem: `Entrance Duplicate of id ${duplicateFound.id}` },
    res,
    toEntranceDuplicate
  );
};
