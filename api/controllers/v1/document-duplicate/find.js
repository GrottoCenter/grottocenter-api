const ControllerService = require('../../../services/ControllerService');
const DescriptionService = require('../../../services/DescriptionService');
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

  if (
    !(await sails.helpers.checkIfExists.with({
      attributeName: 'id',
      attributeValue: req.param('id'),
      sailsModel: TDocumentDuplicate,
    }))
  ) {
    return res.badRequest(
      `Could not find duplicate with id ${req.param('id')}.`
    );
  }
  const duplicate = await TDocumentDuplicate.findOne(req.param('id')).populate(
    'author'
  );

  // Populate the document
  const found = await TDocument.findOne(duplicate.document)
    .populate('author')
    .populate('authorizationDocument')
    .populate('authors')
    .populate('cave')
    .populate('editor')
    .populate('entrance')
    .populate('files')
    .populate('identifierType')
    .populate('languages')
    .populate('library')
    .populate('license')
    .populate('massif')
    .populate('option')
    .populate('parent')
    .populate('regions')
    .populate('reviewer')
    .populate('subjects')
    .populate('type');
  await DescriptionService.setDocumentDescriptions(found);
  duplicate.document = found;

  // Populate the duplicate
  const duplicateDoc = duplicate.content.document;
  const duplicateDesc = duplicate.content.description;
  let descLang;
  if (duplicateDesc.documentMainLanguage?.id) {
    duplicateDoc.languages = [duplicateDesc.documentMainLanguage.id];
    duplicateDesc.documentMainLanguage = undefined;
  }
  if (duplicateDesc.titleAndDescriptionLanguage?.id) {
    descLang = duplicateDesc.titleAndDescriptionLanguage.id;
    duplicateDesc.titleAndDescriptionLanguage = undefined;
  }

  const popDuplicate = await DocumentService.populateJSON(duplicateDoc);
  const descLangTable = descLang
    ? await TLanguage.findOne(descLang)
    : undefined;
  popDuplicate.descriptions = [
    {
      ...duplicateDesc,
      language: descLangTable,
    },
  ];
  duplicate.content = popDuplicate;

  const params = {
    searchedItem: `Document Duplicate of id ${duplicate.id}`,
  };

  return ControllerService.treatAndConvert(
    req,
    null,
    duplicate,
    params,
    res,
    toDocumentDuplicate
  );
};
