const ramda = require('ramda');
const ControllerService = require('../../../services/ControllerService');
const DescriptionService = require('../../../services/DescriptionService');
const DocumentService = require('../../../services/DocumentService');
const ErrorService = require('../../../services/ErrorService');
const MappingService = require('../../../services/MappingService');
const NameService = require('../../../services/NameService');

module.exports = async (req, res) => {
  let found;
  let err;
  if (req.param('requireUpdate') === 'true') {
    const { id, modifiedDocJson } = await TDocument.findOne(req.param('id'));
    if (modifiedDocJson === null) {
      return res.serverError('This document has not been updated.');
    }
    try {
      const {
        author,
        title,
        description,
        titleAndDescriptionLanguage,
        descriptions,
        documentMainLanguage,
        newFiles,
        modifiedFiles,
        deletedFiles,
        ...otherData
      } = modifiedDocJson;
      const populatedDoc = await DocumentService.populateJSON({
        author,
        ...otherData,
      });
      found = { ...populatedDoc, id };

      // Files retrieval
      let filesCriterias = {
        document: id,
        isValidated: true,
      };
      // Don't retrieve files which are modified, new or deleted (because we already have them).
      // New are those which have isValidated = false
      let filesToIgnore = modifiedFiles || [];
      filesToIgnore =
        (deletedFiles && ramda.concat(filesToIgnore, deletedFiles)) ||
        filesToIgnore;
      const filesToIgnoreId = filesToIgnore.map((file) => file.id);

      if (!ramda.isEmpty(filesToIgnoreId)) {
        filesCriterias = {
          document: id,
          id: { '!=': filesToIgnoreId },
          isValidated: true,
        };
      }
      const files = await TFile.find(filesCriterias);
      found.files = files;
      found.newFiles = newFiles;
      found.deletedFiles = deletedFiles;
      found.modifiedFiles = modifiedFiles;

      // We can only modify the main language, so we don't have a "languages" attribute
      // stored in the json. Uncomment if the possibility to add language is implemented.
      // if (languages) {
      //   found.languages = await Promise.all(languages.map(async (language) => {
      //     const completeLanguage = await TLanguage.findOne(language);
      //     return completeLanguage;
      //   }));
      // } else {
      //   found.languages = [];
      // }

      found.mainLanguage = await TLanguage.findOne(documentMainLanguage);

      // Populate names & descriptions
      await NameService.setNames([found.editor], 'grotto');
      await DescriptionService.setDocumentDescriptions(found.parent, false);

      // Handle the description because even if it has been modified,
      // the entry in TDescription stayed intact.
      const descLang = await TLanguage.findOne(titleAndDescriptionLanguage);
      found.descriptions = [];
      found.descriptions.push({
        author,
        title,
        body: description,
        document: id,
        language: descLang,
      });
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
    }
  } else {
    found = await TDocument.findOne(req.param('id'))
      .populate('author')
      .populate('authorizationDocument')
      .populate('authors')
      .populate('cave')
      .populate('descriptions')
      .populate('editor')
      .populate('entrance')
      .populate('files', {
        where: {
          isValidated: true,
        },
      })
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
    const params = {
      controllerMethod: 'DocumentController.find',
      searchedItem: `Document of id ${req.param('id')}`,
    };
    if (!found) {
      const notFoundMessage = `${params.searchedItem} not found`;
      sails.log.debug(notFoundMessage);
      return res.status(404).send(notFoundMessage);
    }
    found.mainLanguage = await DocumentService.getMainLanguage(found.languages);
    await DocumentService.setNamesOfPopulatedDocument(found);
    await DescriptionService.setDocumentDescriptions(found);
  }

  const params = {
    controllerMethod: 'DocumentController.find',
    searchedItem: `Document of id ${req.param('id')}`,
  };

  if (!found) {
    const notFoundMessage = `${params.searchedItem} not found`;
    sails.log.debug(notFoundMessage);
    res.status(404);
    return res.json({ error: notFoundMessage });
  }

  return ControllerService.treatAndConvert(
    req,
    err,
    found,
    params,
    res,
    MappingService.convertToDocumentModel
  );
};
