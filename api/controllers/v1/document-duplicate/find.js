const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');
const RightService = require('../../../services/RightService');
const { toDocumentDuplicate } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight) {
    return res.forbidden(
      'You are not authorized to find a document duplicate.'
    );
  }

  const duplicate = await TDocumentDuplicate.findOne(req.param('id')).populate(
    'author'
  );
  if (!duplicate) return res.notFound(`${req.param('id')} not found`);
  const params = { searchedItem: `Document Duplicate of id ${duplicate.id}` };

  duplicate.document = await DocumentService.getPopulatedDocument(
    duplicate.document
  );

  // Populate the duplicate content
  const duplicateDoc = duplicate.content.document; // From CSV import getConvertedDocumentFromCsv() data format
  const duplicateDesc = duplicate.content.description; // From CSV import getConvertedDescriptionFromCsv() data format

  duplicate.content = await DocumentService.populateJSON(
    duplicate.document.id,
    duplicateDoc
  );
  duplicate.content.descriptions = [duplicateDesc];

  return ControllerService.treatAndConvert(
    req,
    null,
    duplicate,
    params,
    res,
    toDocumentDuplicate
  );
};
